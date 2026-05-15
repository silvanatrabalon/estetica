-- create_appointment: SECURITY DEFINER RPC for atomic booking creation.
-- Tasks: 2.1–2.9 of appointment-booking change.
--
-- Validates: service active, booking policy window, capacity.
-- Auto-assigns: first active staff member (by created_at ASC) with no overlapping appointment.
-- Returns: id, service_id, staff_member_id, starts_at, ends_at, status, created_at.

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
  -- 2.1 Require authenticated caller
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'BOOKING_UNAUTHORIZED' using errcode = 'P0001';
  end if;

  -- Load singleton organization (booking policy)
  select *
    into v_org
    from public.organizations
    limit 1;

  if not found then
    raise exception 'BOOKING_SERVICE_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- 2.2 Validate service exists and is active
  select *
    into v_service
    from public.services
   where id = p_service_id
     and is_active = true;

  if not found then
    raise exception 'BOOKING_SERVICE_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- 2.4 Compute ends_at server-side
  v_ends_at := p_starts_at + (v_service.duration_minutes * interval '1 minute');

  -- 2.3 Validate booking policy window
  v_earliest_starts := now() + (coalesce(v_org.booking_min_notice_minutes, 60) * interval '1 minute');
  v_latest_date := (now() at time zone coalesce(v_org.timezone, 'UTC'))::date
                   + coalesce(v_org.booking_max_horizon_days, 60);

  if p_starts_at < v_earliest_starts then
    raise exception 'BOOKING_OUTSIDE_POLICY_WINDOW' using errcode = 'P0001';
  end if;

  if (p_starts_at at time zone coalesce(v_org.timezone, 'UTC'))::date > v_latest_date then
    raise exception 'BOOKING_OUTSIDE_POLICY_WINDOW' using errcode = 'P0001';
  end if;

  -- 2.5 Enforce max_concurrent_bookings (NULL = no limit)
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

  -- 2.6 Auto-assign first available staff member (no overlap, ordered by created_at ASC)
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

  -- 2.7 Insert the appointment
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

  -- 2.8 Return the new appointment row
  return query
    select
      a.id,
      a.service_id,
      a.staff_member_id,
      a.starts_at,
      a.ends_at,
      a.status,
      a.created_at
    from public.appointments a
   where a.id = v_appointment_id;
end;
$$;

-- 2.9 Grant execute to authenticated users
grant execute on function public.create_appointment(uuid, timestamptz) to authenticated;
