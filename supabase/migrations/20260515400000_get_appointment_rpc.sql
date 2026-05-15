-- get_appointment: SECURITY DEFINER RPC for booking confirmation page.
-- Returns a single joined appointment row for the owning customer or any staff/admin.
-- Returns empty (no error) when not found or unauthorized — prevents ID enumeration.
--
-- NOTE: RETURNS TABLE declares 'id' as an OUT parameter. All table references
-- in the body use explicit aliases (a.id, s.id, etc.) to avoid error 42702
-- (ambiguous column reference between OUT parameter and table column).

create or replace function public.get_appointment(
  p_appointment_id uuid
)
returns table(
  id                       uuid,
  starts_at                timestamptz,
  ends_at                  timestamptz,
  status                   text,
  created_at               timestamptz,
  customer_user_id         uuid,
  service_name             text,
  service_duration_minutes integer,
  service_price_cents      integer,
  staff_display_name       text,
  org_name                 text,
  org_timezone             text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      a.id,
      a.starts_at,
      a.ends_at,
      a.status,
      a.created_at,
      a.customer_user_id,
      s.name             as service_name,
      s.duration_minutes as service_duration_minutes,
      s.price_cents      as service_price_cents,
      sm.display_name    as staff_display_name,
      o.name             as org_name,
      o.timezone         as org_timezone
    from public.appointments a
    join public.services      s  on s.id  = a.service_id
    join public.staff_members sm on sm.id = a.staff_member_id
    join public.organizations o  on o.id  = a.organization_id
    where a.id = p_appointment_id
      and (
        a.customer_user_id = auth.uid()
        or is_staff_or_admin()
      );
end;
$$;

grant execute on function public.get_appointment(uuid) to authenticated;
