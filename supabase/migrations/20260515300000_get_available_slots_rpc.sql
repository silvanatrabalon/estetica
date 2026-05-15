-- get_available_slots RPC: slot generator for the customer booking wizard.
-- Returns available (starts_at, ends_at) UTC pairs for a service on a given date.
--
-- Pipeline:
--   1. Booking policy horizon early-exit  (16c)
--   2. Business closure early-exit        (16a)
--   3. Business hours gate                (16a)
--   4. Service date whitelist filter      (16b)
--   5. Per-staff working window resolution (exception → schedule → empty fallback) (16a)
--   6. Intersect staff window with business hours (16a)
--   7. Convert wall-clock → UTC           (16a)
--   8. Generate 30-minute candidate slots; clip overflow (16a)
--   9. Drop slots inside notice cutoff    (16c)
--  10. Drop slots overlapping existing appointments per staff (16a)
--  11. Drop slots at/above max_concurrent_bookings capacity (16b)
--  12. Aggregate: slot included if ≥1 staff survives all filters (16a)

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
  -- SLOT_INTERVAL: fixed 30-minute granularity (future config candidate)
  v_slot_interval       constant interval := interval '30 minutes';

  v_org_id              uuid;
  v_org_timezone        text;
  v_duration_minutes    integer;
  v_max_concurrent      integer;
  v_min_notice_minutes  integer;
  v_max_horizon_days    integer;
  v_horizon_date        date;
  v_day_of_week         smallint;
  v_biz_opens           time;
  v_biz_closes          time;
begin
  -- ── Load organization, service, and booking policy ─────────────────────────
  select
    o.id,
    o.timezone,
    s.duration_minutes,
    s.max_concurrent_bookings,
    coalesce(o.booking_min_notice_minutes, 60),
    coalesce(o.booking_max_horizon_days,   60)
  into
    v_org_id,
    v_org_timezone,
    v_duration_minutes,
    v_max_concurrent,
    v_min_notice_minutes,
    v_max_horizon_days
  from public.services s
  join public.organizations o on o.id = s.organization_id
  where s.id = p_service_id
    and s.is_active = true;

  -- Service not found or inactive → return no slots
  if not found then
    return;
  end if;

  -- ── Step 1: Booking policy horizon early-exit ─────────────────────────────
  v_horizon_date := (now() at time zone v_org_timezone)::date + v_max_horizon_days;
  if p_date > v_horizon_date then
    return;
  end if;

  -- ── Step 2: Business closure early-exit ───────────────────────────────────
  if exists (
    select 1
    from public.business_closure_exceptions bce
    where bce.organization_id = v_org_id
      and bce.closure_date    = p_date
      and bce.closure_type    = 'full_day'
  ) then
    return;
  end if;

  -- ── Step 3: Business hours gate ───────────────────────────────────────────
  -- day_of_week: 0=Sunday … 6=Saturday (matches PostgreSQL extract(dow))
  v_day_of_week := extract(dow from p_date)::smallint;

  select bh.opens_at, bh.closes_at
  into v_biz_opens, v_biz_closes
  from public.business_hours bh
  where bh.organization_id = v_org_id
    and bh.day_of_week     = v_day_of_week
    and bh.is_closed       = false;

  -- No open business_hours row → closed
  if not found then
    return;
  end if;

  -- ── Step 4: Service date whitelist filter ─────────────────────────────────
  -- If any date rows exist for this service, the requested date must be in the set.
  if exists (
    select 1
    from public.service_available_dates sad
    where sad.service_id = p_service_id
  ) then
    if not exists (
      select 1
      from public.service_available_dates sad
      where sad.service_id    = p_service_id
        and sad.available_date = p_date
    ) then
      return;
    end if;
  end if;

  -- ── Steps 5–12: Per-staff slot generation ─────────────────────────────────
  -- Returned as DISTINCT to deduplicate across multiple staff members.
  return query
  select distinct
    slot.slot_start as starts_at,
    slot.slot_start + (v_duration_minutes || ' minutes')::interval as ends_at
  from (
    -- Generate candidate slots for each active assigned staff member
    select
      sm.id                                                           as staff_id,
      (p_date + eff.window_start) at time zone v_org_timezone        as slot_start,
      (p_date + eff.window_end)   at time zone v_org_timezone        as window_end_utc
    from public.staff_services ss
    join public.staff_members sm
      on sm.id = ss.staff_member_id
      and sm.is_active = true

    -- Step 5: Resolve effective working window per staff
    -- Exception row takes priority; fall back to recurring schedule
    cross join lateral (
      select
        case
          when exc.exception_type = 'day_off'       then null::time
          when exc.exception_type = 'custom_hours'  then exc.starts_at
          else                                            sch.starts_at
        end as window_start,
        case
          when exc.exception_type = 'day_off'       then null::time
          when exc.exception_type = 'custom_hours'  then exc.ends_at
          else                                            sch.ends_at
        end as window_end
      from (
        select coalesce(
          (select e.exception_type from public.staff_schedule_exceptions e
            where e.staff_member_id = sm.id and e.exception_date = p_date),
          null
        ) as exception_type,
        (select e.starts_at from public.staff_schedule_exceptions e
          where e.staff_member_id = sm.id and e.exception_date = p_date) as starts_at,
        (select e.ends_at from public.staff_schedule_exceptions e
          where e.staff_member_id = sm.id and e.exception_date = p_date) as ends_at,
        (select sc.starts_at from public.staff_schedules sc
          where sc.staff_member_id = sm.id and sc.day_of_week = v_day_of_week and sc.is_working = true) as sch_starts_at,
        (select sc.ends_at from public.staff_schedules sc
          where sc.staff_member_id = sm.id and sc.day_of_week = v_day_of_week and sc.is_working = true) as sch_ends_at
      ) raw
      cross join lateral (
        select
          case
            when raw.exception_type = 'day_off'                    then null::time
            when raw.exception_type = 'custom_hours'               then raw.starts_at
            when raw.exception_type is null and raw.sch_starts_at is not null then raw.sch_starts_at
            else null::time
          end as window_start,
          case
            when raw.exception_type = 'day_off'                    then null::time
            when raw.exception_type = 'custom_hours'               then raw.ends_at
            when raw.exception_type is null and raw.sch_ends_at is not null   then raw.sch_ends_at
            else null::time
          end as window_end
      ) resolved
    ) eff

    where ss.service_id = p_service_id
      -- Discard staff with no working window on this date
      and eff.window_start is not null
      and eff.window_end   is not null
  ) raw_windows

  -- Step 6+7: Generate slots within intersection of staff window and business hours, converted to UTC
  cross join lateral generate_series(
    greatest(
      (p_date + raw_windows.window_start) at time zone v_org_timezone,
      (p_date + v_biz_opens)              at time zone v_org_timezone
    ),
    least(
      (p_date + raw_windows.window_end)  at time zone v_org_timezone,
      (p_date + v_biz_closes)            at time zone v_org_timezone
    ) - (v_duration_minutes || ' minutes')::interval,
    v_slot_interval
  ) as slot(slot_start)

  where
    -- Step 8: Clip overflow (slot must end within business hours)
    slot.slot_start + (v_duration_minutes || ' minutes')::interval <=
      least(
        (p_date + raw_windows.window_end)  at time zone v_org_timezone,
        (p_date + v_biz_closes)            at time zone v_org_timezone
      )

    -- Step 9: Drop slots inside minimum notice cutoff
    and slot.slot_start >= now() + (v_min_notice_minutes || ' minutes')::interval

    -- Step 10: Drop slots overlapping existing appointments for this staff member
    and not exists (
      select 1
      from public.appointments a
      where a.staff_member_id = raw_windows.staff_id
        and a.status          in ('pending', 'confirmed')
        and slot.slot_start   < a.ends_at
        and slot.slot_start + (v_duration_minutes || ' minutes')::interval > a.starts_at
    )

    -- Step 11: Drop slots at/above max_concurrent_bookings capacity
    and (
      v_max_concurrent is null
      or (
        select count(*)
        from public.appointments a2
        where a2.service_id = p_service_id
          and a2.status     in ('pending', 'confirmed')
          and slot.slot_start   < a2.ends_at
          and slot.slot_start + (v_duration_minutes || ' minutes')::interval > a2.starts_at
      ) < v_max_concurrent
    )

  order by 1;
end;
$$;

-- Grant EXECUTE to authenticated users only (anon cannot call)
grant execute on function public.get_available_slots(uuid, date) to authenticated;
revoke execute on function public.get_available_slots(uuid, date) from anon;
