-- Fix: admin_update_staff_member UPDATE WHERE clause uses unqualified 'id'.
-- Error 42702 "column reference 'id' is ambiguous" because RETURNS TABLE
-- declares 'id' as an OUT parameter in PL/pgSQL scope.
-- Fix: qualify the WHERE predicate with the table name.

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

  update public.staff_members sm
  set display_name = p_display_name,
      updated_at   = now()
  where sm.id = p_staff_id;

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
