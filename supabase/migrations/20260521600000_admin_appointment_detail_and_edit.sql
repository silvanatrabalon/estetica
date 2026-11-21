-- Admin appointment detail + edit.
--
-- 1. admin_get_appointment: one appointment with the client's contact data, notes and names.
-- 2. admin_update_appointment: change service, professional and notes of a pending/confirmed
--    appointment. The end time is recomputed from the service duration; the start time is NOT
--    changed here (that is "reprogramar"). Overlaps with another appointment of the same
--    professional are rejected by the excl_appointments_staff_no_overlap constraint.
-- 3. admin_list_staff_for_service: active professionals assigned to a service (for the edit form).
--
-- All three are admin-only (SECURITY DEFINER + is_admin()).

create or replace function public.admin_get_appointment(p_appointment_id uuid)
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
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden ver el detalle de un turno.'
      using errcode = 'P0001';
  end if;

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
  where a.id = p_appointment_id;
end;
$$;

create or replace function public.admin_list_staff_for_service(p_service_id uuid)
returns table (staff_member_id uuid, display_name text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden ver los profesionales de un servicio.'
      using errcode = 'P0001';
  end if;

  return query
  select sm.id, sm.display_name::text
  from public.staff_services ss
  join public.staff_members sm on sm.id = ss.staff_member_id
  where ss.service_id = p_service_id
    and sm.is_active = true
  order by sm.display_name;
end;
$$;

create or replace function public.admin_update_appointment(
  p_appointment_id  uuid,
  p_service_id      uuid,
  p_staff_member_id uuid,
  p_notes           text default null
)
returns table (
  id              uuid,
  service_id      uuid,
  staff_member_id uuid,
  starts_at       timestamptz,
  ends_at         timestamptz,
  status          text,
  notes           text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apt      public.appointments%rowtype;
  v_service  public.services%rowtype;
  v_staff    public.staff_members%rowtype;
  v_notes    text;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden editar turnos.'
      using errcode = 'P0001';
  end if;

  select * into v_apt from public.appointments a where a.id = p_appointment_id for update;
  if not found then
    raise exception 'APPOINTMENT_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_apt.status not in ('pending', 'confirmed') then
    raise exception 'APPOINTMENT_NOT_EDITABLE' using errcode = 'P0001';
  end if;

  select * into v_service from public.services s
  where s.id = p_service_id and s.organization_id = v_apt.organization_id and s.is_active = true;
  if not found then
    raise exception 'SERVICE_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  select * into v_staff from public.staff_members sm
  where sm.id = p_staff_member_id and sm.organization_id = v_apt.organization_id and sm.is_active = true;
  if not found then
    raise exception 'STAFF_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.staff_services ss
    where ss.staff_member_id = p_staff_member_id and ss.service_id = p_service_id
  ) then
    raise exception 'STAFF_NOT_ASSIGNED_TO_SERVICE' using errcode = 'P0001';
  end if;

  v_notes := nullif(btrim(coalesce(p_notes, '')), '');
  if v_notes is not null and length(v_notes) > 500 then
    raise exception 'NOTES_TOO_LONG' using errcode = 'P0001';
  end if;

  begin
    update public.appointments a
    set service_id      = p_service_id,
        staff_member_id = p_staff_member_id,
        ends_at         = v_apt.starts_at + (v_service.duration_minutes || ' minutes')::interval,
        notes           = v_notes,
        updated_at      = now()
    where a.id = p_appointment_id;
  exception when exclusion_violation then
    raise exception 'APPOINTMENT_CONFLICT' using errcode = 'P0001';
  end;

  return query
  select a.id, a.service_id, a.staff_member_id, a.starts_at, a.ends_at, a.status, a.notes
  from public.appointments a
  where a.id = p_appointment_id;
end;
$$;

revoke all on function public.admin_get_appointment(uuid) from public, anon;
revoke all on function public.admin_list_staff_for_service(uuid) from public, anon;
revoke all on function public.admin_update_appointment(uuid, uuid, uuid, text) from public, anon;
grant execute on function public.admin_get_appointment(uuid) to authenticated;
grant execute on function public.admin_list_staff_for_service(uuid) to authenticated;
grant execute on function public.admin_update_appointment(uuid, uuid, uuid, text) to authenticated;
