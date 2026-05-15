-- Fix: qualify all column references in create_appointment to resolve
-- error 42702 "column reference 'id' is ambiguous".
-- The RETURNS TABLE defines OUT parameters named id, service_id, etc.
-- which conflict with unqualified column references inside the body.

create or replace function public.create_appointment(
  p_service_id  uuid,
  p_starts_at   timestamptz
)
returns table (
  id              uuid,
  service_id      uuid,
  staff_member_id uuid,
  starts_at       timestamptz,
  ends_at         timestamptz,
  status          text,
  created_at      timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id           uuid;
  v_org               record;
  v_service           record;
  v_ends_at           timestamptz;
  v_earliest_starts   timestamptz;
  v_latest_date       date;
  v_concurrent_count  integer;
  v_staff_id          uuid;
  v_appointment_id    uuid;
begin
  -- Require authenticated caller
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'BOOKING_UNAUTHORIZED' using errcode = 'P0001';
  end if;

  -- Load singleton organization (booking policy)
  select org.*
    into v_org
    from public.organizations org
    limit 1;

  if not found then
    raise exception 'BOOKING_SERVICE_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Validate service exists and is active (use alias to avoid OUT param ambiguity)
  select svc.*
    into v_service
    from public.services svc
   where svc.id = p_service_id
     and svc.is_active = true;

  if not found then
    raise exception 'BOOKING_SERVICE_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Compute ends_at server-side
  v_ends_at := p_starts_at + (v_service.duration_minutes * interval '1 minute');

  -- Validate booking policy window
  v_earliest_starts := now() + (coalesce(v_org.booking_min_notice_minutes, 60) * interval '1 minute');
  v_latest_date := (now() at time zone coalesce(v_org.timezone, 'UTC'))::date
                   + coalesce(v_org.booking_max_horizon_days, 60);

  if p_starts_at < v_earliest_starts then
    raise exception 'BOOKING_OUTSIDE_POLICY_WINDOW' using errcode = 'P0001';
  end if;

  if (p_starts_at at time zone coalesce(v_org.timezone, 'UTC'))::date > v_latest_date then
    raise exception 'BOOKING_OUTSIDE_POLICY_WINDOW' using errcode = 'P0001';
  end if;

  -- Enforce max_concurrent_bookings (NULL = no limit)
  if v_service.max_concurrent_bookings is not null then
    select count(*)
      into v_concurrent_count
      from public.appointments a
     where a.service_id = p_service_id
       and a.status in ('pending', 'confirmed')
       and a.starts_at < v_ends_at
       and a.ends_at > p_starts_at;

    if v_concurrent_count >= v_service.max_concurrent_bookings then
      raise exception 'BOOKING_CAPACITY_EXCEEDED' using errcode = 'P0001';
    end if;
  end if;

  -- Auto-assign first available staff member (no overlap, ordered by created_at ASC)
  select sm.id
    into v_staff_id
    from public.staff_members sm
    join public.staff_services ss
      on ss.staff_member_id = sm.id
     and ss.service_id = p_service_id
   where sm.is_active = true
     and not exists (
       select 1
         from public.appointments a
        where a.staff_member_id = sm.id
          and a.status in ('pending', 'confirmed')
          and a.starts_at < v_ends_at
          and a.ends_at > p_starts_at
     )
   order by sm.created_at asc
   limit 1;

  if v_staff_id is null then
    raise exception 'BOOKING_NO_STAFF_AVAILABLE' using errcode = 'P0001';
  end if;

  -- Insert the appointment
  insert into public.appointments (
    organization_id,
    service_id,
    staff_member_id,
    customer_user_id,
    created_by_user_id,
    starts_at,
    ends_at,
    status
  )
  values (
    v_org.id,
    p_service_id,
    v_staff_id,
    v_user_id,
    v_user_id,
    p_starts_at,
    v_ends_at,
    'confirmed'
  )
  returning appointments.id into v_appointment_id;

  -- Return the new appointment row (all columns table-qualified)
  return query
    select
      appt.id,
      appt.service_id,
      appt.staff_member_id,
      appt.starts_at,
      appt.ends_at,
      appt.status,
      appt.created_at
    from public.appointments appt
   where appt.id = v_appointment_id;
end;
$$;
