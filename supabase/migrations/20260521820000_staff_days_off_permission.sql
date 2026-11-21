-- Separate permission for days off / special days.
--
-- The admin already decides per professional whether they can edit their own weekly
-- schedule (staff_members.can_edit_own_availability). This adds a second, independent
-- switch for their days off and special days (staff_members.can_edit_own_days_off).
-- Both are enforced in the self-service RPCs. Admins are never blocked.

alter table public.staff_members
  add column if not exists can_edit_own_days_off boolean not null default true;

create or replace function public.get_my_days_off_permission()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select case
    when public.is_admin() then true
    else (
      select sm.can_edit_own_days_off
      from public.staff_members sm
      where sm.profile_user_id = auth.uid()
        and sm.is_active = true
      limit 1
    )
  end;
$$;

create or replace function public.get_my_days_off_staff_member_id()
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
       where id = v_staff_id and can_edit_own_days_off = true
     )
  then
    raise exception 'No tenés permiso para editar tus días libres. Contactá al administrador.'
      using errcode = '42501';
  end if;

  return v_staff_id;
end;
$$;

-- Self-service exception RPCs now use the days-off guard.
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
  v_staff_id := public.get_my_days_off_staff_member_id();

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

create or replace function public.staff_delete_my_exception(p_exception_date date)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_staff_id uuid;
  v_id       uuid;
begin
  v_staff_id := public.get_my_days_off_staff_member_id();

  delete from public.staff_schedule_exceptions
  where staff_member_id = v_staff_id
    and exception_date = p_exception_date
  returning id into v_id;

  return v_id;
end;
$$;

-- Admin: read both permissions and change the new one.
drop function if exists public.admin_list_staff_availability_permissions();
create or replace function public.admin_list_staff_availability_permissions()
returns table (
  staff_member_id           uuid,
  can_edit_own_availability boolean,
  can_edit_own_days_off     boolean
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select sm.id, sm.can_edit_own_availability, sm.can_edit_own_days_off
  from public.staff_members sm
  where public.is_admin();
$$;

create or replace function public.admin_set_staff_days_off_permission(
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
  set can_edit_own_days_off = p_allowed,
      updated_at = now()
  where id = p_staff_id;

  if not found then
    raise exception 'Profesional no encontrado.';
  end if;
end;
$$;

revoke all on function public.get_my_days_off_staff_member_id() from public, anon, authenticated;
revoke all on function public.get_my_days_off_permission() from public, anon;
revoke all on function public.admin_list_staff_availability_permissions() from public, anon;
revoke all on function public.admin_set_staff_days_off_permission(uuid, boolean) from public, anon;
grant execute on function public.get_my_days_off_permission() to authenticated;
grant execute on function public.staff_upsert_my_exception(date, text, time, time, text, time, time) to authenticated;
grant execute on function public.staff_delete_my_exception(date) to authenticated;
grant execute on function public.admin_list_staff_availability_permissions() to authenticated;
grant execute on function public.admin_set_staff_days_off_permission(uuid, boolean) to authenticated;
