-- Per-professional permission to edit their own availability.
--
-- The admin decides, for each professional, whether they can change their own weekly
-- schedule and exceptions. Existing professionals keep the ability (default true).
-- The check is enforced in the self-service RPCs (not only in the UI). Admins are never
-- blocked, since they can already edit any professional's availability.

alter table public.staff_members
  add column if not exists can_edit_own_availability boolean not null default true;

-- ──────────────────────────────────────────────────────────────────────────────
-- Read: may the current user edit their own availability?
-- Returns null when the user has no active staff profile.
-- ──────────────────────────────────────────────────────────────────────────────
create or replace function public.get_my_availability_permission()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when public.is_admin() then true
    else (
      select sm.can_edit_own_availability
      from public.staff_members sm
      where sm.profile_user_id = auth.uid()
        and sm.is_active = true
      limit 1
    )
  end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Guard used by the self-service write RPCs
-- ──────────────────────────────────────────────────────────────────────────────
create or replace function public.get_my_editable_staff_member_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_staff_id uuid;
begin
  v_staff_id := public.get_my_staff_member_id();

  if not public.is_admin()
     and not exists (
       select 1 from public.staff_members
       where id = v_staff_id and can_edit_own_availability = true
     )
  then
    raise exception 'No tenés permiso para editar tu disponibilidad. Contactá al administrador.'
      using errcode = '42501';
  end if;

  return v_staff_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Self-service RPCs: same behavior as before, now behind the guard
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
  v_staff_id := public.get_my_editable_staff_member_id();

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
  v_staff_id := public.get_my_editable_staff_member_id();

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
  v_staff_id := public.get_my_editable_staff_member_id();

  delete from public.staff_schedule_exceptions
  where staff_member_id = v_staff_id
    and exception_date = p_exception_date
  returning id into v_id;

  return v_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Admin: read and change the permission
-- ──────────────────────────────────────────────────────────────────────────────
create or replace function public.admin_list_staff_availability_permissions()
returns table (staff_member_id uuid, can_edit_own_availability boolean)
language sql
stable
security definer
set search_path = public, auth
as $$
  select sm.id, sm.can_edit_own_availability
  from public.staff_members sm
  where public.is_admin();
$$;

create or replace function public.admin_set_staff_availability_permission(
  p_staff_id uuid,
  p_allowed  boolean
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden cambiar este permiso.';
  end if;

  update public.staff_members
  set can_edit_own_availability = p_allowed,
      updated_at = now()
  where id = p_staff_id;

  if not found then
    raise exception 'Profesional no encontrado.';
  end if;
end;
$$;

revoke all on function public.get_my_editable_staff_member_id() from public, anon, authenticated;
grant execute on function public.get_my_availability_permission() to authenticated;
grant execute on function public.staff_set_my_schedule(jsonb) to authenticated;
grant execute on function public.staff_upsert_my_exception(date, text, time, time, text) to authenticated;
grant execute on function public.staff_delete_my_exception(date) to authenticated;
grant execute on function public.admin_list_staff_availability_permissions() to authenticated;
grant execute on function public.admin_set_staff_availability_permission(uuid, boolean) to authenticated;
