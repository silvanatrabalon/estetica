-- list_appointments: SECURITY DEFINER RPC for appointment list views (customer and staff).
-- Role-aware: customer → own appointments; staff → assigned appointments; admin → all.
-- Hard limit: 200 rows ordered by starts_at DESC.
--
-- NOTE: RETURNS TABLE declares 'id' as an OUT parameter. All table references
-- in the body use explicit aliases (a.id, etc.) to avoid PL/pgSQL error 42702
-- (ambiguous column reference between OUT parameter and table column).

create or replace function public.list_appointments()
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
  org_timezone             text,
  customer_name            text
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
      o.timezone         as org_timezone,
      p.full_name        as customer_name
    from public.appointments  a
    join public.services      s  on s.id  = a.service_id
    join public.staff_members sm on sm.id = a.staff_member_id
    join public.organizations o  on o.id  = a.organization_id
    left join public.profiles p  on p.user_id = a.customer_user_id
    where (
      -- Customer: own appointments only
      (not is_staff_or_admin() and a.customer_user_id = auth.uid())
      -- Staff: assigned appointments only (not admin)
      or (is_staff_or_admin() and not is_admin() and sm.profile_user_id = auth.uid())
      -- Admin: all org appointments
      or is_admin()
    )
    order by a.starts_at desc
    limit 200;
end;
$$;

grant execute on function public.list_appointments() to authenticated;
