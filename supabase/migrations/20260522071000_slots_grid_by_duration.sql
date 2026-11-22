-- Slots start on a fixed grid whose step is the service duration rounded up to a multiple of 30 min
-- (30 -> 30, 45 -> 60, 60 -> 60, 90 -> 90), counted from midnight, so all professionals line up.

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
  v_slot_interval       interval;

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

  -- A 60 min service starts at 10:00, 11:00, 12:00: the blocks shown to the client never overlap.
  v_slot_interval := (greatest(30, ceil(v_duration_minutes / 30.0)::integer * 30) || ' minutes')::interval;

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
    (p_date::timestamp at time zone v_org_timezone)
      + ceil(extract(epoch from (w.lo - (p_date::timestamp at time zone v_org_timezone)))
             / extract(epoch from v_slot_interval)) * v_slot_interval,
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
