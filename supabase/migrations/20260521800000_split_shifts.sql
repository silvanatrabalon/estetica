-- Split shifts ("turno matutino" / "turno vespertino").
--
-- The business chooses how it works (organizations.split_shifts):
--   false = one continuous working day, true = morning + afternoon shifts with a break.
-- Business hours, each professional's weekly schedule and special days can all have a
-- second (afternoon) window. The first window keeps the original columns (the morning shift);
-- the second one lives in pm_* columns. Either window may be empty (only morning / only afternoon).
--
-- Also fixes create_appointment: it auto-assigned any professional without an overlapping
-- appointment, without checking that they work at that time. It now requires the slot to fit
-- inside a working window of the professional AND an open window of the business.

-- ── 1. Columns ────────────────────────────────────────────────────────────────

alter table public.organizations
  add column if not exists split_shifts boolean not null default false;

alter table public.business_hours
  add column if not exists pm_opens_at time,
  add column if not exists pm_closes_at time;

alter table public.staff_schedules
  add column if not exists pm_starts_at time,
  add column if not exists pm_ends_at time;

alter table public.staff_schedule_exceptions
  add column if not exists pm_starts_at time,
  add column if not exists pm_ends_at time;

-- ── 2. Constraints (drop old single-window rules first) ───────────────────────

alter table public.business_hours drop constraint if exists business_hours_check;
alter table public.staff_schedules drop constraint if exists chk_staff_schedules_hours;
alter table public.staff_schedule_exceptions drop constraint if exists chk_staff_schedule_exceptions_hours;

-- Existing rows that start in the afternoon belong to the afternoon shift.
update public.business_hours
   set pm_opens_at = opens_at, pm_closes_at = closes_at, opens_at = null, closes_at = null
 where is_closed = false and opens_at >= time '13:00';

update public.staff_schedules
   set pm_starts_at = starts_at, pm_ends_at = ends_at, starts_at = null, ends_at = null
 where is_working = true and starts_at >= time '13:00';

update public.staff_schedule_exceptions
   set pm_starts_at = starts_at, pm_ends_at = ends_at, starts_at = null, ends_at = null
 where exception_type = 'custom_hours' and starts_at >= time '13:00';

alter table public.business_hours add constraint chk_business_hours_windows check (
  (is_closed = true and opens_at is null and closes_at is null
     and pm_opens_at is null and pm_closes_at is null)
  or
  (is_closed = false
     and ((opens_at is null) = (closes_at is null))
     and ((pm_opens_at is null) = (pm_closes_at is null))
     and (opens_at is not null or pm_opens_at is not null)
     and (opens_at is null or opens_at < closes_at)
     and (pm_opens_at is null or pm_opens_at < pm_closes_at)
     and (opens_at is null or pm_opens_at is null or closes_at <= pm_opens_at))
);

alter table public.staff_schedules add constraint chk_staff_schedules_windows check (
  (is_working = false and starts_at is null and ends_at is null
     and pm_starts_at is null and pm_ends_at is null)
  or
  (is_working = true
     and ((starts_at is null) = (ends_at is null))
     and ((pm_starts_at is null) = (pm_ends_at is null))
     and (starts_at is not null or pm_starts_at is not null)
     and (starts_at is null or starts_at < ends_at)
     and (pm_starts_at is null or pm_starts_at < pm_ends_at)
     and (starts_at is null or pm_starts_at is null or ends_at <= pm_starts_at))
);

alter table public.staff_schedule_exceptions add constraint chk_staff_schedule_exceptions_windows check (
  (exception_type = 'day_off' and starts_at is null and ends_at is null
     and pm_starts_at is null and pm_ends_at is null)
  or
  (exception_type = 'custom_hours'
     and ((starts_at is null) = (ends_at is null))
     and ((pm_starts_at is null) = (pm_ends_at is null))
     and (starts_at is not null or pm_starts_at is not null)
     and (starts_at is null or starts_at < ends_at)
     and (pm_starts_at is null or pm_starts_at < pm_ends_at)
     and (starts_at is null or pm_starts_at is null or ends_at <= pm_starts_at))
);

-- ── 3. Window helpers ─────────────────────────────────────────────────────────

-- Effective working windows of a professional on a date (exception wins over weekly schedule).
create or replace function public.staff_working_windows(p_staff_member_id uuid, p_date date)
returns table (window_start time, window_end time)
language sql
stable
security definer
set search_path = public
as $$
  select v.s, v.e
  from (
    select e.exception_type as kind, e.starts_at as a_s, e.ends_at as a_e,
           e.pm_starts_at as p_s, e.pm_ends_at as p_e
      from public.staff_schedule_exceptions e
     where e.staff_member_id = p_staff_member_id and e.exception_date = p_date
    union all
    select 'schedule', sc.starts_at, sc.ends_at, sc.pm_starts_at, sc.pm_ends_at
      from public.staff_schedules sc
     where sc.staff_member_id = p_staff_member_id
       and sc.day_of_week = extract(dow from p_date)::smallint
       and sc.is_working = true
       and not exists (
         select 1 from public.staff_schedule_exceptions e2
          where e2.staff_member_id = p_staff_member_id and e2.exception_date = p_date)
  ) r
  cross join lateral (values (r.a_s, r.a_e), (r.p_s, r.p_e)) as v(s, e)
  where r.kind <> 'day_off' and v.s is not null and v.e is not null;
$$;

-- Open windows of the business on a date.
create or replace function public.business_open_windows(p_org_id uuid, p_date date)
returns table (window_start time, window_end time)
language sql
stable
security definer
set search_path = public
as $$
  select v.s, v.e
  from public.business_hours bh
  cross join lateral (values (bh.opens_at, bh.closes_at), (bh.pm_opens_at, bh.pm_closes_at)) as v(s, e)
  where bh.organization_id = p_org_id
    and bh.day_of_week = extract(dow from p_date)::integer
    and bh.is_closed = false
    and v.s is not null and v.e is not null;
$$;

grant execute on function public.staff_working_windows(uuid, date) to authenticated;
grant execute on function public.business_open_windows(uuid, date) to authenticated;
revoke execute on function public.staff_working_windows(uuid, date) from anon;
revoke execute on function public.business_open_windows(uuid, date) from anon;

-- ── 4. Switching the business mode ────────────────────────────────────────────

-- Turning split shifts off merges every day into one continuous window
-- (first start to last end), in business hours, schedules and special days.
create or replace function public.admin_set_split_shifts(p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  update public.organizations set split_shifts = p_enabled;

  if not p_enabled then
    update public.business_hours
       set opens_at = least(opens_at, pm_opens_at),
           closes_at = greatest(closes_at, pm_closes_at),
           pm_opens_at = null, pm_closes_at = null
     where pm_opens_at is not null;

    update public.staff_schedules
       set starts_at = least(starts_at, pm_starts_at),
           ends_at = greatest(ends_at, pm_ends_at),
           pm_starts_at = null, pm_ends_at = null
     where pm_starts_at is not null;

    update public.staff_schedule_exceptions
       set starts_at = least(starts_at, pm_starts_at),
           ends_at = greatest(ends_at, pm_ends_at),
           pm_starts_at = null, pm_ends_at = null
     where pm_starts_at is not null;
  end if;

  return p_enabled;
end;
$$;

revoke all on function public.admin_set_split_shifts(boolean) from public, anon;
grant execute on function public.admin_set_split_shifts(boolean) to authenticated;

-- ── 5. Schedule / exception RPCs with the second window ──────────────────────

create or replace function public.admin_set_staff_schedule(
  p_staff_member_id uuid,
  p_schedule        jsonb
)
returns setof public.staff_schedules
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  delete from public.staff_schedules where staff_member_id = p_staff_member_id;

  insert into public.staff_schedules
    (staff_member_id, day_of_week, is_working, starts_at, ends_at, pm_starts_at, pm_ends_at)
  select
    p_staff_member_id,
    (row_data->>'day_of_week')::smallint,
    (row_data->>'is_working')::boolean,
    case when (row_data->>'is_working')::boolean then (row_data->>'starts_at')::time else null end,
    case when (row_data->>'is_working')::boolean then (row_data->>'ends_at')::time else null end,
    case when (row_data->>'is_working')::boolean then (row_data->>'pm_starts_at')::time else null end,
    case when (row_data->>'is_working')::boolean then (row_data->>'pm_ends_at')::time else null end
  from jsonb_array_elements(p_schedule) as row_data;

  return query
  select * from public.staff_schedules
  where staff_member_id = p_staff_member_id
  order by day_of_week;
end;
$$;

create or replace function public.staff_set_my_schedule(p_schedule jsonb)
returns setof public.staff_schedules
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_staff_id uuid;
begin
  v_staff_id := public.get_my_editable_staff_member_id();

  delete from public.staff_schedules where staff_member_id = v_staff_id;

  insert into public.staff_schedules
    (staff_member_id, day_of_week, is_working, starts_at, ends_at, pm_starts_at, pm_ends_at)
  select
    v_staff_id,
    (row_data->>'day_of_week')::smallint,
    (row_data->>'is_working')::boolean,
    case when (row_data->>'is_working')::boolean then (row_data->>'starts_at')::time else null end,
    case when (row_data->>'is_working')::boolean then (row_data->>'ends_at')::time else null end,
    case when (row_data->>'is_working')::boolean then (row_data->>'pm_starts_at')::time else null end,
    case when (row_data->>'is_working')::boolean then (row_data->>'pm_ends_at')::time else null end
  from jsonb_array_elements(p_schedule) as row_data;

  return query
  select * from public.staff_schedules
  where staff_member_id = v_staff_id
  order by day_of_week;
end;
$$;

drop function if exists public.admin_upsert_staff_schedule_exception(uuid, date, text, time, time, text);
create or replace function public.admin_upsert_staff_schedule_exception(
  p_staff_member_id uuid,
  p_exception_date  date,
  p_exception_type  text,
  p_starts_at       time default null,
  p_ends_at         time default null,
  p_reason          text default null,
  p_pm_starts_at    time default null,
  p_pm_ends_at      time default null
)
returns setof public.staff_schedule_exceptions
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  insert into public.staff_schedule_exceptions
    (staff_member_id, exception_date, exception_type, starts_at, ends_at, pm_starts_at, pm_ends_at, reason)
  values
    (p_staff_member_id, p_exception_date, p_exception_type, p_starts_at, p_ends_at, p_pm_starts_at, p_pm_ends_at, p_reason)
  on conflict (staff_member_id, exception_date) do update
    set exception_type = excluded.exception_type,
        starts_at      = excluded.starts_at,
        ends_at        = excluded.ends_at,
        pm_starts_at   = excluded.pm_starts_at,
        pm_ends_at     = excluded.pm_ends_at,
        reason         = excluded.reason,
        updated_at     = now();

  return query
  select * from public.staff_schedule_exceptions
  where staff_member_id = p_staff_member_id and exception_date = p_exception_date;
end;
$$;

drop function if exists public.staff_upsert_my_exception(date, text, time, time, text);
create or replace function public.staff_upsert_my_exception(
  p_exception_date  date,
  p_exception_type  text,
  p_starts_at       time default null,
  p_ends_at         time default null,
  p_reason          text default null,
  p_pm_starts_at    time default null,
  p_pm_ends_at      time default null
)
returns setof public.staff_schedule_exceptions
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_staff_id uuid;
begin
  v_staff_id := public.get_my_editable_staff_member_id();

  insert into public.staff_schedule_exceptions
    (staff_member_id, exception_date, exception_type, starts_at, ends_at, pm_starts_at, pm_ends_at, reason)
  values
    (v_staff_id, p_exception_date, p_exception_type, p_starts_at, p_ends_at, p_pm_starts_at, p_pm_ends_at, p_reason)
  on conflict (staff_member_id, exception_date) do update
    set exception_type = excluded.exception_type,
        starts_at      = excluded.starts_at,
        ends_at        = excluded.ends_at,
        pm_starts_at   = excluded.pm_starts_at,
        pm_ends_at     = excluded.pm_ends_at,
        reason         = excluded.reason,
        updated_at     = now();

  return query
  select * from public.staff_schedule_exceptions
  where staff_member_id = v_staff_id and exception_date = p_exception_date;
end;
$$;

grant execute on function public.admin_upsert_staff_schedule_exception(uuid, date, text, time, time, text, time, time) to authenticated;
grant execute on function public.staff_upsert_my_exception(date, text, time, time, text, time, time) to authenticated;

-- ── 6. get_available_slots: one or two windows per professional and per business day ──

create or replace function public.get_available_slots(
  p_service_id uuid,
  p_date       date
)
returns table(starts_at timestamptz, ends_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot_interval       constant interval := interval '30 minutes';

  v_org_id              uuid;
  v_org_timezone        text;
  v_duration_minutes    integer;
  v_max_concurrent      integer;
  v_min_notice_minutes  integer;
  v_max_horizon_days    integer;
  v_horizon_date        date;
begin
  select
    o.id,
    coalesce(o.timezone, 'UTC'),
    s.duration_minutes,
    s.max_concurrent_bookings,
    coalesce(o.booking_min_notice_minutes, 60),
    coalesce(o.booking_max_horizon_days,   60)
  into
    v_org_id, v_org_timezone, v_duration_minutes, v_max_concurrent,
    v_min_notice_minutes, v_max_horizon_days
  from public.services s
  join public.organizations o on o.id = s.organization_id
  where s.id = p_service_id
    and s.is_active = true;

  if not found then
    return;
  end if;

  v_horizon_date := (now() at time zone v_org_timezone)::date + v_max_horizon_days;
  if p_date > v_horizon_date then
    return;
  end if;

  if exists (
    select 1 from public.business_closure_exceptions bce
    where bce.organization_id = v_org_id
      and bce.closure_date    = p_date
      and bce.closure_type    = 'full_day'
  ) then
    return;
  end if;

  if exists (select 1 from public.service_available_dates sad where sad.service_id = p_service_id)
     and not exists (
       select 1 from public.service_available_dates sad
       where sad.service_id = p_service_id and sad.available_date = p_date
     ) then
    return;
  end if;

  if not exists (select 1 from public.business_open_windows(v_org_id, p_date)) then
    return;
  end if;

  return query
  select distinct
    slot.slot_start as starts_at,
    slot.slot_start + (v_duration_minutes || ' minutes')::interval as ends_at
  from (
    select
      sm.id as staff_id,
      (p_date + greatest(sw.window_start, bw.window_start)) at time zone v_org_timezone as lo,
      (p_date + least(sw.window_end, bw.window_end))        at time zone v_org_timezone as hi
    from public.staff_services ss
    join public.staff_members sm
      on sm.id = ss.staff_member_id
     and sm.is_active = true
    cross join lateral public.staff_working_windows(sm.id, p_date) sw
    cross join lateral public.business_open_windows(v_org_id, p_date) bw
    where ss.service_id = p_service_id
      and greatest(sw.window_start, bw.window_start) < least(sw.window_end, bw.window_end)
  ) w
  cross join lateral generate_series(
    w.lo,
    w.hi - (v_duration_minutes || ' minutes')::interval,
    v_slot_interval
  ) as slot(slot_start)
  where
    slot.slot_start >= now() + (v_min_notice_minutes || ' minutes')::interval

    and not exists (
      select 1 from public.appointments a
      where a.staff_member_id = w.staff_id
        and a.status in ('pending', 'confirmed')
        and slot.slot_start < a.ends_at
        and slot.slot_start + (v_duration_minutes || ' minutes')::interval > a.starts_at
    )

    and (
      v_max_concurrent is null
      or (
        select count(*) from public.appointments a2
        where a2.service_id = p_service_id
          and a2.status in ('pending', 'confirmed')
          and slot.slot_start < a2.ends_at
          and slot.slot_start + (v_duration_minutes || ' minutes')::interval > a2.starts_at
      ) < v_max_concurrent
    )

    and not exists (
      select 1 from public.business_closure_exceptions bce
      where bce.organization_id = v_org_id
        and bce.closure_date    = p_date
        and bce.closure_type    = 'half_day'
        and slot.slot_start < (p_date + bce.ends_at)   at time zone v_org_timezone
        and slot.slot_start + (v_duration_minutes || ' minutes')::interval
              > (p_date + bce.starts_at) at time zone v_org_timezone
    )
  order by 1;
end;
$$;

grant execute on function public.get_available_slots(uuid, date) to authenticated;
revoke execute on function public.get_available_slots(uuid, date) from anon;

-- ── 7. create_appointment: only assign a professional who works at that time ──

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
  v_tz                text;
  v_local_date        date;
  v_local_start       time;
  v_local_end         time;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'BOOKING_UNAUTHORIZED' using errcode = 'P0001';
  end if;

  select org.* into v_org from public.organizations org limit 1;
  if not found then
    raise exception 'BOOKING_SERVICE_NOT_FOUND' using errcode = 'P0001';
  end if;

  select svc.* into v_service
    from public.services svc
   where svc.id = p_service_id and svc.is_active = true;
  if not found then
    raise exception 'BOOKING_SERVICE_NOT_FOUND' using errcode = 'P0001';
  end if;

  v_tz := coalesce(v_org.timezone, 'UTC');
  v_ends_at := p_starts_at + (v_service.duration_minutes * interval '1 minute');

  v_earliest_starts := now() + (coalesce(v_org.booking_min_notice_minutes, 60) * interval '1 minute');
  v_latest_date := (now() at time zone v_tz)::date + coalesce(v_org.booking_max_horizon_days, 60);

  if p_starts_at < v_earliest_starts then
    raise exception 'BOOKING_OUTSIDE_POLICY_WINDOW' using errcode = 'P0001';
  end if;

  if (p_starts_at at time zone v_tz)::date > v_latest_date then
    raise exception 'BOOKING_OUTSIDE_POLICY_WINDOW' using errcode = 'P0001';
  end if;

  v_local_date  := (p_starts_at at time zone v_tz)::date;
  v_local_start := (p_starts_at at time zone v_tz)::time;
  v_local_end   := (v_ends_at   at time zone v_tz)::time;

  -- The appointment must fit inside an open window of the business (same day).
  if (v_ends_at at time zone v_tz)::date <> v_local_date
     or not exists (
       select 1 from public.business_open_windows(v_org.id, v_local_date) bw
        where bw.window_start <= v_local_start and bw.window_end >= v_local_end)
  then
    raise exception 'BOOKING_NO_STAFF_AVAILABLE' using errcode = 'P0001';
  end if;

  if v_service.max_concurrent_bookings is not null then
    select count(*) into v_concurrent_count
      from public.appointments a
     where a.service_id = p_service_id
       and a.status in ('pending', 'confirmed')
       and a.starts_at < v_ends_at
       and a.ends_at > p_starts_at;

    if v_concurrent_count >= v_service.max_concurrent_bookings then
      raise exception 'BOOKING_CAPACITY_EXCEEDED' using errcode = 'P0001';
    end if;
  end if;

  -- Auto-assign the first professional who works at that time and has no overlap.
  select sm.id into v_staff_id
    from public.staff_members sm
    join public.staff_services ss
      on ss.staff_member_id = sm.id and ss.service_id = p_service_id
   where sm.is_active = true
     and exists (
       select 1 from public.staff_working_windows(sm.id, v_local_date) sw
        where sw.window_start <= v_local_start and sw.window_end >= v_local_end)
     and not exists (
       select 1 from public.appointments a
        where a.staff_member_id = sm.id
          and a.status in ('pending', 'confirmed')
          and a.starts_at < v_ends_at
          and a.ends_at > p_starts_at)
   order by sm.created_at asc
   limit 1;

  if v_staff_id is null then
    raise exception 'BOOKING_NO_STAFF_AVAILABLE' using errcode = 'P0001';
  end if;

  insert into public.appointments (
    organization_id, service_id, staff_member_id, customer_user_id,
    created_by_user_id, starts_at, ends_at, status
  )
  values (
    v_org.id, p_service_id, v_staff_id, v_user_id,
    v_user_id, p_starts_at, v_ends_at, 'confirmed'
  )
  returning appointments.id into v_appointment_id;

  return query
    select appt.id, appt.service_id, appt.staff_member_id, appt.starts_at,
           appt.ends_at, appt.status, appt.created_at
      from public.appointments appt
     where appt.id = v_appointment_id;
end;
$$;
