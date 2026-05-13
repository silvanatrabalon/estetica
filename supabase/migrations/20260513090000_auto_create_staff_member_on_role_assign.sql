-- When the staff role is assigned to a user, auto-create a staff_members stub
-- so the user appears immediately in /admin/staff for availability configuration.
-- Uses the user's profile full_name (or email prefix as fallback) as display_name.
-- No-op if the user already has a staff_members record.

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

  insert into public.user_roles (user_id, role, granted_by_user_id, is_active, updated_at)
  values (target_user_id, target_role, actor_id, user_is_active, now())
  on conflict (user_id, role) do nothing;

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

-- ──────────────────────────────────────────────────────────────────────────────
-- Backfill: create staff_members stubs for users who already have the staff
-- role but don't have a staff_members record yet.
-- ──────────────────────────────────────────────────────────────────────────────
do $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from public.organizations limit 1;

  if v_org_id is null then
    return;
  end if;

  insert into public.staff_members (organization_id, profile_user_id, display_name)
  select
    v_org_id,
    ur.user_id,
    coalesce(
      nullif(trim(p.full_name), ''),
      nullif(split_part(u.email, '@', 1), ''),
      'Profesional'
    )
  from public.user_roles ur
  join auth.users u on u.id = ur.user_id
  left join public.profiles p on p.user_id = ur.user_id
  where ur.role = 'staff'
    and not exists (
      select 1 from public.staff_members sm
      where sm.organization_id = v_org_id
        and sm.profile_user_id = ur.user_id
    );
end;
$$;
