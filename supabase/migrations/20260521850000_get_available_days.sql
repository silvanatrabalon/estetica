-- get_available_days: which days in a range have free slots for a service, and how many.
--
-- The booking calendar uses it to disable the days that cannot be booked (closed days,
-- days off, fully booked, outside the booking window) and to hint how busy each day is.
-- It reuses get_available_slots, so it follows exactly the same rules. Days without any
-- free slot are not returned.

create or replace function public.get_available_days(
  p_service_id uuid,
  p_from       date,
  p_to         date
)
returns table (day date, slot_count integer)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_date date;
  v_count integer;
begin
  if p_from is null or p_to is null or p_to < p_from then
    return;
  end if;

  if p_to - p_from > 92 then
    raise exception 'RANGE_TOO_LARGE' using errcode = 'P0001';
  end if;

  for v_date in select g::date from generate_series(p_from, p_to, interval '1 day') g loop
    select count(*)::integer into v_count from public.get_available_slots(p_service_id, v_date);
    if v_count > 0 then
      day := v_date;
      slot_count := v_count;
      return next;
    end if;
  end loop;
end;
$$;

revoke all on function public.get_available_days(uuid, date, date) from public, anon;
grant execute on function public.get_available_days(uuid, date, date) to authenticated;
