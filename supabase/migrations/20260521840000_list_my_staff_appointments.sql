-- list_my_staff_appointments: the appointments where the caller is the professional.
--
-- list_appointments returns every appointment to admins, so an admin who switched to the
-- staff role saw everyone's agenda. The staff views (Agenda, Inicio) use this instead:
-- only the appointments assigned to the logged-in professional, admin or not.

create or replace function public.list_my_staff_appointments()
returns table(
  id                       uuid,
  starts_at                timestamptz,
  ends_at                  timestamptz,
  status                   text,
  created_at               timestamptz,
  customer_user_id         uuid,
  service_id               uuid,
  service_name             text,
  service_duration_minutes integer,
  service_price_cents      integer,
  staff_display_name       text,
  org_name                 text,
  org_timezone             text,
  customer_name            text
)
language plpgsql
stable
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
      a.service_id,
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
    where sm.profile_user_id = auth.uid()
    order by a.starts_at desc
    limit 200;
end;
$$;

revoke all on function public.list_my_staff_appointments() from public, anon;
grant execute on function public.list_my_staff_appointments() to authenticated;
