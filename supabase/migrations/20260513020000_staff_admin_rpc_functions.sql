-- Admin RPC functions for staff member management.
-- All functions are SECURITY DEFINER and guard against non-admin callers.
-- Follows the admin_list_users / admin_update_user_role RPC pattern.

-- List all staff members joined with their profile name and current app role
create or replace function public.admin_list_staff_members()
returns table (
  id uuid,
  organization_id uuid,
  profile_user_id uuid,
  display_name text,
  is_active boolean,
  created_at timestamptz,
  full_name text,
  role public.app_role
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    sm.id,
    sm.organization_id,
    sm.profile_user_id,
    sm.display_name,
    sm.is_active,
    sm.created_at,
    p.full_name,
    coalesce(ur.role, 'customer'::public.app_role) as role
  from public.staff_members sm
  left join public.profiles p on p.user_id = sm.profile_user_id
  left join public.user_roles ur on ur.user_id = sm.profile_user_id
  where public.is_admin()
  order by sm.created_at asc;
$$;

-- Create a staff member linked to an existing user and auto-assign the staff role
create or replace function public.admin_create_staff_member(
  p_profile_user_id uuid,
  p_display_name text
)
returns table (
  id uuid,
  organization_id uuid,
  profile_user_id uuid,
  display_name text,
  is_active boolean,
  created_at timestamptz,
  full_name text,
  role public.app_role
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_org_id uuid;
  v_staff_id uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden crear profesionales.';
  end if;

  select o.id into v_org_id
  from public.organizations o
  limit 1;

  if v_org_id is null then
    raise exception 'No se encontró la organización.';
  end if;

  insert into public.staff_members (organization_id, profile_user_id, display_name)
  values (v_org_id, p_profile_user_id, p_display_name)
  returning public.staff_members.id into v_staff_id;

  -- Auto-assign staff role if the user does not already have one
  insert into public.user_roles (user_id, role, granted_by_user_id)
  values (p_profile_user_id, 'staff'::public.app_role, auth.uid())
  on conflict (user_id) do nothing;

  return query
    select
      sm.id,
      sm.organization_id,
      sm.profile_user_id,
      sm.display_name,
      sm.is_active,
      sm.created_at,
      p.full_name,
      coalesce(ur.role, 'customer'::public.app_role) as role
    from public.staff_members sm
    left join public.profiles p on p.user_id = sm.profile_user_id
    left join public.user_roles ur on ur.user_id = sm.profile_user_id
    where sm.id = v_staff_id;
end;
$$;

-- Update the display name of an existing staff member
create or replace function public.admin_update_staff_member(
  p_staff_id uuid,
  p_display_name text
)
returns table (
  id uuid,
  organization_id uuid,
  profile_user_id uuid,
  display_name text,
  is_active boolean,
  created_at timestamptz,
  full_name text,
  role public.app_role
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden editar profesionales.';
  end if;

  update public.staff_members
  set display_name = p_display_name,
      updated_at = now()
  where id = p_staff_id;

  if not found then
    raise exception 'Profesional no encontrado.';
  end if;

  return query
    select
      sm.id,
      sm.organization_id,
      sm.profile_user_id,
      sm.display_name,
      sm.is_active,
      sm.created_at,
      p.full_name,
      coalesce(ur.role, 'customer'::public.app_role) as role
    from public.staff_members sm
    left join public.profiles p on p.user_id = sm.profile_user_id
    left join public.user_roles ur on ur.user_id = sm.profile_user_id
    where sm.id = p_staff_id;
end;
$$;

-- Set the active status of a staff member (reversible deactivation)
create or replace function public.admin_set_staff_active(
  p_staff_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden activar o desactivar profesionales.';
  end if;

  update public.staff_members
  set is_active = p_is_active,
      updated_at = now()
  where id = p_staff_id;

  if not found then
    raise exception 'Profesional no encontrado.';
  end if;
end;
$$;

grant execute on function public.admin_list_staff_members() to authenticated;
grant execute on function public.admin_create_staff_member(uuid, text) to authenticated;
grant execute on function public.admin_update_staff_member(uuid, text) to authenticated;
grant execute on function public.admin_set_staff_active(uuid, boolean) to authenticated;
