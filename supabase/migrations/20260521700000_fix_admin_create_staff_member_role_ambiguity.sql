-- Fix: admin_create_staff_member failed with
--   42702 column reference "role" is ambiguous
-- because the function returns a column named "role", which clashed with the
-- "role" in `on conflict (user_id, role)`. Replace it with a NOT EXISTS insert.

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

  -- Auto-assign the staff role if the user does not have it yet.
  insert into public.user_roles (user_id, role, granted_by_user_id)
  select p_profile_user_id, 'staff'::public.app_role, auth.uid()
  where not exists (
    select 1 from public.user_roles ur
    where ur.user_id = p_profile_user_id
      and ur.role = 'staff'::public.app_role
  );

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
