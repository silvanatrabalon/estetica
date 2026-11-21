-- A professional's name is the name of their account.
--
-- There is no separate "nombre para mostrar" anymore:
--   * creating a professional takes the account's name (profile full name, then the email prefix);
--   * renaming the account renames the professional (trigger on profiles);
--   * existing professionals are aligned once with their account's name.
-- staff_members.display_name stays as a column because many screens, emails and reports read it,
-- but it is kept in sync automatically.

CREATE OR REPLACE FUNCTION public.admin_create_staff_member(p_profile_user_id uuid, p_display_name text)
 RETURNS TABLE(id uuid, organization_id uuid, profile_user_id uuid, display_name text, is_active boolean, created_at timestamp with time zone, full_name text, role app_role)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  v_org_id uuid;
  v_staff_id uuid;
  v_name text;
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

  -- The professional's name is the account's name (the one from Google). The name typed by the
  -- caller is only a last resort when the account has no name at all.
  select coalesce(
           nullif(btrim(p.full_name), ''),
           nullif(split_part(u.email, '@', 1), ''),
           nullif(btrim(p_display_name), ''),
           'Profesional'
         )
    into v_name
    from auth.users u
    left join public.profiles p on p.user_id = u.id
   where u.id = p_profile_user_id;

  insert into public.staff_members (organization_id, profile_user_id, display_name)
  values (v_org_id, p_profile_user_id, coalesce(v_name, 'Profesional'))
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
$function$
;

create or replace function public.sync_staff_display_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(btrim(new.full_name), '') is not null then
    update public.staff_members sm
       set display_name = btrim(new.full_name), updated_at = now()
     where sm.profile_user_id = new.user_id
       and sm.display_name is distinct from btrim(new.full_name);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_sync_staff_name on public.profiles;
create trigger trg_profiles_sync_staff_name
  after insert or update of full_name on public.profiles
  for each row execute function public.sync_staff_display_name();

-- One-time alignment of existing professionals
update public.staff_members sm
   set display_name = btrim(p.full_name), updated_at = now()
  from public.profiles p
 where p.user_id = sm.profile_user_id
   and nullif(btrim(p.full_name), '') is not null
   and sm.display_name is distinct from btrim(p.full_name);
