-- Fix staff RPC functions for multi-role composite PK:
--
-- 1. admin_list_staff_members  — return 'staff' as role (remove coalesce subquery)
-- 2. admin_update_staff_member — return 'staff' as role, remove LEFT JOIN user_roles (avoids duplicate rows)
-- 3. admin_create_staff_member — fix ON CONFLICT clause for composite PK (user_id, role)
--                                and return 'staff' as role, remove LEFT JOIN user_roles

-- 1. admin_list_staff_members
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
    'staff'::public.app_role as role
  from public.staff_members sm
  left join public.profiles p on p.user_id = sm.profile_user_id
  where public.is_admin()
    -- Only users with the staff role need availability configuration.
    -- Admin is a system role; unlinked staff slots are always included.
    and (
      sm.profile_user_id is null
      or exists (
        select 1 from public.user_roles ur
        where ur.user_id = sm.profile_user_id
          and ur.role = 'staff'
      )
    )
  order by sm.created_at asc;
$$;

-- 2. admin_update_staff_member
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
      'staff'::public.app_role as role
    from public.staff_members sm
    left join public.profiles p on p.user_id = sm.profile_user_id
    where sm.id = p_staff_id;
end;
$$;

-- 3. admin_create_staff_member
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

  -- Auto-assign staff role if not already present (composite PK: user_id + role)
  insert into public.user_roles (user_id, role, granted_by_user_id)
  values (p_profile_user_id, 'staff'::public.app_role, auth.uid())
  on conflict (user_id, role) do nothing;

  return query
    select
      sm.id,
      sm.organization_id,
      sm.profile_user_id,
      sm.display_name,
      sm.is_active,
      sm.created_at,
      p.full_name,
      'staff'::public.app_role as role
    from public.staff_members sm
    left join public.profiles p on p.user_id = sm.profile_user_id
    where sm.id = v_staff_id;
end;
$$;
