-- Staff self-service RPCs for managing their own availability.
-- Staff members can only edit their OWN schedule — ownership is enforced
-- by resolving staff_member_id from staff_members WHERE profile_user_id = auth.uid().

-- Helper: resolve the current user's staff_member id and fail if not found.
create or replace function public.get_my_staff_member_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_staff_id uuid;
begin
  select id into v_staff_id
  from public.staff_members
  where profile_user_id = auth.uid()
    and is_active = true
  limit 1;

  if v_staff_id is null then
    raise exception 'No se encontró un profesional activo para este usuario.';
  end if;

  return v_staff_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- staff_set_my_schedule
-- Atomically replaces the 7-day weekly template for the current staff member.
-- ──────────────────────────────────────────────────────────────────────────────
create or replace function public.staff_set_my_schedule(
  p_schedule jsonb
)
returns setof public.staff_schedules
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_staff_id uuid;
begin
  v_staff_id := public.get_my_staff_member_id();

  delete from public.staff_schedules
  where staff_member_id = v_staff_id;

  insert into public.staff_schedules (staff_member_id, day_of_week, is_working, starts_at, ends_at)
  select
    v_staff_id,
    (row_data->>'day_of_week')::smallint,
    (row_data->>'is_working')::boolean,
    case when (row_data->>'is_working')::boolean then (row_data->>'starts_at')::time else null end,
    case when (row_data->>'is_working')::boolean then (row_data->>'ends_at')::time else null end
  from jsonb_array_elements(p_schedule) as row_data;

  return query
  select * from public.staff_schedules
  where staff_member_id = v_staff_id
  order by day_of_week;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- staff_upsert_my_exception
-- Creates or updates a single exception date for the current staff member.
-- ──────────────────────────────────────────────────────────────────────────────
create or replace function public.staff_upsert_my_exception(
  p_exception_date  date,
  p_exception_type  text,
  p_starts_at       time    default null,
  p_ends_at         time    default null,
  p_reason          text    default null
)
returns setof public.staff_schedule_exceptions
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_staff_id uuid;
begin
  v_staff_id := public.get_my_staff_member_id();

  insert into public.staff_schedule_exceptions (staff_member_id, exception_date, exception_type, starts_at, ends_at, reason)
  values (v_staff_id, p_exception_date, p_exception_type, p_starts_at, p_ends_at, p_reason)
  on conflict (staff_member_id, exception_date) do update
    set exception_type = excluded.exception_type,
        starts_at      = excluded.starts_at,
        ends_at        = excluded.ends_at,
        reason         = excluded.reason,
        updated_at     = now();

  return query
  select * from public.staff_schedule_exceptions
  where staff_member_id = v_staff_id
    and exception_date = p_exception_date;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- staff_delete_my_exception
-- Removes an exception date for the current staff member.
-- ──────────────────────────────────────────────────────────────────────────────
create or replace function public.staff_delete_my_exception(
  p_exception_date date
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_staff_id uuid;
  v_id       uuid;
begin
  v_staff_id := public.get_my_staff_member_id();

  delete from public.staff_schedule_exceptions
  where staff_member_id = v_staff_id
    and exception_date = p_exception_date
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.get_my_staff_member_id() to authenticated;
grant execute on function public.staff_set_my_schedule(jsonb) to authenticated;
grant execute on function public.staff_upsert_my_exception(date, text, time, time, text) to authenticated;
grant execute on function public.staff_delete_my_exception(date) to authenticated;
