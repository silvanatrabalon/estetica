-- staff_get_appointment: appointment detail for the professional it belongs to (or an admin).
--
-- get_appointment only works for the customer who booked it, so a professional opening a
-- booking from their agenda got "no autorizado". This returns the same data admin_get_appointment
-- does (client name, email, phone, notes, service, professional), limited to the caller's own
-- appointments; admins can read any.

create or replace function public.staff_get_appointment(p_appointment_id uuid)
returns table (
  id                       uuid,
  service_id               uuid,
  staff_member_id          uuid,
  starts_at                timestamptz,
  ends_at                  timestamptz,
  status                   text,
  notes                    text,
  created_at               timestamptz,
  customer_user_id         uuid,
  customer_name            text,
  customer_email           text,
  customer_phone           text,
  service_name             text,
  service_duration_minutes integer,
  service_price_cents      integer,
  staff_display_name       text,
  org_timezone             text
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  return query
  select
    a.id,
    a.service_id,
    a.staff_member_id,
    a.starts_at,
    a.ends_at,
    a.status,
    a.notes,
    a.created_at,
    a.customer_user_id,
    coalesce(nullif(btrim(p.full_name), ''), au.email, 'Cliente sin nombre')::text as customer_name,
    au.email::text      as customer_email,
    p.phone::text       as customer_phone,
    s.name::text        as service_name,
    s.duration_minutes::integer as service_duration_minutes,
    s.price_cents::integer      as service_price_cents,
    sm.display_name::text       as staff_display_name,
    coalesce(o.timezone, 'UTC')::text as org_timezone
  from public.appointments a
  join public.services s       on s.id  = a.service_id
  join public.staff_members sm on sm.id = a.staff_member_id
  join public.organizations o  on o.id  = a.organization_id
  left join public.profiles p  on p.user_id = a.customer_user_id
  left join auth.users au      on au.id = a.customer_user_id
  where a.id = p_appointment_id
    and (public.is_admin() or sm.profile_user_id = auth.uid());
end;
$$;

revoke all on function public.staff_get_appointment(uuid) from public, anon;
grant execute on function public.staff_get_appointment(uuid) to authenticated;
