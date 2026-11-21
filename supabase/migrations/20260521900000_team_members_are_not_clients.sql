-- (Superseded by 20260521910000, which restores the previous behavior.)
-- Admin and staff cannot be clients: assigning admin/staff removed the client role and adding
-- the client role to them raised ROLE_CONFLICT. Kept here so the migration history matches the
-- database.

create or replace function public.admin_assign_user_role(
  target_user_id uuid,
  target_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id       uuid := auth.uid();
  user_is_active boolean;
  v_org_id       uuid;
  v_display_name text;
begin
  if actor_id is null then
    raise exception 'authenticated user is required';
  end if;

  if not public.is_admin() then
    raise exception 'only admin users can assign roles';
  end if;

  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'target user does not exist';
  end if;

  -- Inherit is_active from existing rows for this user (default true for new users)
  select coalesce(
    (select is_active from public.user_roles where user_id = target_user_id limit 1),
    true
  ) into user_is_active;

  if target_role = 'customer' and exists (
    select 1 from public.user_roles ur
     where ur.user_id = target_user_id and ur.role in ('admin', 'staff')
  ) then
    raise exception 'ROLE_CONFLICT: un administrador o staff no puede ser cliente' using errcode = 'P0001';
  end if;

  insert into public.user_roles (user_id, role, granted_by_user_id, is_active, updated_at)
  values (target_user_id, target_role, actor_id, user_is_active, now())
  on conflict (user_id, role) do nothing;

  if target_role in ('admin', 'staff') then
    delete from public.user_roles ur
     where ur.user_id = target_user_id and ur.role = 'customer';
  end if;

  -- When assigning the staff role, ensure a staff_members record exists
  -- so the user immediately appears in the admin staff management panel.
  if target_role = 'staff' then
    select id into v_org_id
    from public.organizations
    limit 1;

    if v_org_id is not null and not exists (
      select 1 from public.staff_members
      where organization_id = v_org_id
        and profile_user_id = target_user_id
    ) then
      -- Resolve display name: profile full_name > email prefix > fallback
      select coalesce(
        nullif(trim(p.full_name), ''),
        nullif(split_part(u.email, '@', 1), ''),
        'Profesional'
      ) into v_display_name
      from auth.users u
      left join public.profiles p on p.user_id = u.id
      where u.id = target_user_id;

      insert into public.staff_members (organization_id, profile_user_id, display_name)
      values (v_org_id, target_user_id, coalesce(v_display_name, 'Profesional'));
    end if;
  end if;
end;
$$;
