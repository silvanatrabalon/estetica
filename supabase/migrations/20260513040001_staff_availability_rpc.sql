-- Admin-only SECURITY DEFINER RPC functions for staff availability mutations.
-- All functions check is_admin() and raise an exception for unauthorized callers.

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_set_staff_schedule
-- Atomically replaces the full 7-day weekly template for a staff member.
-- p_schedule: JSON array of objects with day_of_week, is_working, starts_at, ends_at.
-- ──────────────────────────────────────────────────────────────────────────────

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

  delete from public.staff_schedules
  where staff_member_id = p_staff_member_id;

  insert into public.staff_schedules (staff_member_id, day_of_week, is_working, starts_at, ends_at)
  select
    p_staff_member_id,
    (row_data->>'day_of_week')::smallint,
    (row_data->>'is_working')::boolean,
    case when (row_data->>'is_working')::boolean then (row_data->>'starts_at')::time else null end,
    case when (row_data->>'is_working')::boolean then (row_data->>'ends_at')::time else null end
  from jsonb_array_elements(p_schedule) as row_data;

  return query
  select * from public.staff_schedules
  where staff_member_id = p_staff_member_id
  order by day_of_week;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_upsert_staff_schedule_exception
-- Creates or updates a single exception date for a staff member.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_upsert_staff_schedule_exception(
  p_staff_member_id uuid,
  p_exception_date  date,
  p_exception_type  text,
  p_starts_at       time     default null,
  p_ends_at         time     default null,
  p_reason          text     default null
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

  insert into public.staff_schedule_exceptions (staff_member_id, exception_date, exception_type, starts_at, ends_at, reason)
  values (p_staff_member_id, p_exception_date, p_exception_type, p_starts_at, p_ends_at, p_reason)
  on conflict (staff_member_id, exception_date) do update
    set exception_type = excluded.exception_type,
        starts_at      = excluded.starts_at,
        ends_at        = excluded.ends_at,
        reason         = excluded.reason,
        updated_at     = now();

  return query
  select * from public.staff_schedule_exceptions
  where staff_member_id = p_staff_member_id
    and exception_date = p_exception_date;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_delete_staff_schedule_exception
-- Removes an exception date for a staff member.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_delete_staff_schedule_exception(
  p_staff_member_id uuid,
  p_exception_date  date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  delete from public.staff_schedule_exceptions
  where staff_member_id = p_staff_member_id
    and exception_date = p_exception_date
  returning id into v_id;

  return v_id;
end;
$$;
