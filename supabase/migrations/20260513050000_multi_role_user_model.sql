-- Multi-role user model
-- Changes user_roles primary key from (user_id) to (user_id, role)
-- so a single user account can hold multiple canonical roles.
-- Updates RLS helper functions and admin RPCs for the new schema.

-- Step 1: Change primary key from user_id to (user_id, role)
alter table public.user_roles drop constraint user_roles_pkey;
alter table public.user_roles add primary key (user_id, role);

-- Step 2: Update trigger function to use the new conflict target
create or replace function public.handle_new_auth_user_role()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- Step 3: Update current_app_role() to return the highest-privilege role
-- across all rows for the authenticated user.
-- Returns null if the user is deactivated (any is_active = false row).
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when auth.uid() is null then null
      when exists (
        select 1
        from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.is_active = false
      ) then null
      else (
        select ur.role
        from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.is_active = true
        order by
          case ur.role
            when 'admin'::public.app_role    then 1
            when 'staff'::public.app_role    then 2
            when 'customer'::public.app_role then 3
            else 4
          end
        limit 1
      )
    end;
$$;

-- Step 4: Update is_admin() to use EXISTS on the multi-row table
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'::public.app_role
      and ur.is_active = true
  );
$$;

-- Step 5: Update is_staff_or_admin() to use EXISTS on the multi-row table
create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('staff'::public.app_role, 'admin'::public.app_role)
      and ur.is_active = true
  );
$$;

-- Step 6: Add get_user_roles() — returns all active roles for the
-- authenticated user ordered by privilege (admin > staff > customer).
create or replace function public.get_user_roles()
returns public.app_role[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    array_agg(
      ur.role
      order by
        case ur.role
          when 'admin'::public.app_role    then 1
          when 'staff'::public.app_role    then 2
          when 'customer'::public.app_role then 3
          else 4
        end
    ),
    array['customer'::public.app_role]
  )
  from public.user_roles ur
  where ur.user_id = auth.uid()
    and ur.is_active = true;
$$;

-- Step 7: Add admin_assign_user_role() — inserts a role assignment row.
-- No-op if the user already has that role (on conflict do nothing).
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
  actor_id uuid := auth.uid();
  user_is_active boolean;
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
end;
$$;

-- Step 8: Add admin_revoke_user_role() — deletes a role assignment row.
-- Enforces last-admin lockout: cannot remove the admin role if only one
-- active admin would remain.
create or replace function public.admin_revoke_user_role(
  target_user_id uuid,
  target_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  active_admin_count integer;
begin
  if actor_id is null then
    raise exception 'authenticated user is required';
  end if;

  if not public.is_admin() then
    raise exception 'only admin users can revoke roles';
  end if;

  if target_role = 'admin'::public.app_role then
    select count(*)
    into active_admin_count
    from public.user_roles ur
    where ur.role = 'admin'::public.app_role
      and ur.is_active = true;

    if active_admin_count <= 1 and exists (
      select 1 from public.user_roles
      where user_id = target_user_id
        and role = 'admin'::public.app_role
    ) then
      raise exception 'cannot revoke the last active admin role';
    end if;
  end if;

  delete from public.user_roles
  where user_id = target_user_id
    and role = target_role;
end;
$$;

-- Step 9: Update admin_set_user_active() to update ALL role rows for the user.
-- A user is active or deactivated at the account level (all rows updated together).
create or replace function public.admin_set_user_active(
  target_user_id uuid,
  make_active boolean
)
returns public.user_roles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  active_admin_count integer;
  result_row public.user_roles;
begin
  if actor_id is null then
    raise exception 'authenticated user is required';
  end if;

  if not public.is_admin() then
    raise exception 'only admin users can change activation state';
  end if;

  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'target user does not exist';
  end if;

  if make_active = false then
    -- Prevent deactivating the last active admin
    if exists (
      select 1 from public.user_roles
      where user_id = target_user_id
        and role = 'admin'::public.app_role
        and is_active = true
    ) then
      select count(*)
      into active_admin_count
      from public.user_roles
      where role = 'admin'::public.app_role
        and is_active = true;

      if active_admin_count <= 1 then
        raise exception 'cannot deactivate the last active admin';
      end if;
    end if;
  end if;

  -- Update all rows for this user (is_active is account-level)
  update public.user_roles
  set is_active = make_active,
      updated_at = now()
  where user_id = target_user_id;

  -- Return one representative row
  select * into result_row
  from public.user_roles
  where user_id = target_user_id
  order by
    case role
      when 'admin'::public.app_role    then 1
      when 'staff'::public.app_role    then 2
      when 'customer'::public.app_role then 3
      else 4
    end
  limit 1;

  return result_row;
end;
$$;

-- Step 10: Update admin_list_users() to return roles app_role[] (aggregated).
-- Must drop first because the return type changes (role -> roles[]).
drop function if exists public.admin_list_users();
create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  full_name text,
  phone text,
  roles public.app_role[],
  is_active boolean
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    u.id as user_id,
    u.email,
    u.created_at,
    u.last_sign_in_at,
    p.full_name,
    p.phone,
    coalesce(
      array_agg(
        ur.role
        order by
          case ur.role
            when 'admin'::public.app_role    then 1
            when 'staff'::public.app_role    then 2
            when 'customer'::public.app_role then 3
            else 4
          end
      ) filter (where ur.role is not null),
      array['customer'::public.app_role]
    ) as roles,
    coalesce(bool_and(ur.is_active), true) as is_active
  from auth.users u
  left join public.user_roles ur on ur.user_id = u.id
  left join public.profiles p on p.user_id = u.id
  where public.is_admin()
  group by u.id, u.email, u.created_at, u.last_sign_in_at, p.full_name, p.phone
  order by u.created_at asc;
$$;

-- Step 11: Update admin_user_analytics() for multi-role (count unique users per role).
create or replace function public.admin_user_analytics()
returns table (
  total_users bigint,
  active_users bigint,
  inactive_users bigint,
  customer_users bigint,
  staff_users bigint,
  admin_users bigint,
  recent_signups_30_days bigint
)
language sql
stable
security definer
set search_path = public, auth
as $$
  with user_state as (
    select
      u.id,
      u.created_at,
      coalesce(bool_and(ur.is_active), true) as is_active,
      coalesce(
        array_agg(ur.role) filter (where ur.role is not null),
        array['customer'::public.app_role]
      ) as roles
    from auth.users u
    left join public.user_roles ur on ur.user_id = u.id
    group by u.id, u.created_at
  )
  select
    count(*)                                                                  as total_users,
    count(*) filter (where is_active)                                        as active_users,
    count(*) filter (where not is_active)                                    as inactive_users,
    count(*) filter (where 'customer'::public.app_role = any(roles))         as customer_users,
    count(*) filter (where 'staff'::public.app_role    = any(roles))         as staff_users,
    count(*) filter (where 'admin'::public.app_role    = any(roles))         as admin_users,
    count(*) filter (where created_at >= now() - interval '30 days')         as recent_signups_30_days
  from user_state
  where public.is_admin();
$$;

-- Step 12: Update admin_update_user_role() to work with composite PK.
-- Backward-compat: sets user to exactly ONE role (replaces all existing roles).
create or replace function public.admin_update_user_role(
  target_user_id uuid,
  target_role public.app_role
)
returns public.user_roles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := auth.uid();
  existing_is_active boolean;
  active_admin_count integer;
  result_row public.user_roles;
begin
  if actor_id is null then
    raise exception 'authenticated user is required';
  end if;

  if not public.is_admin() then
    raise exception 'only admin users can change roles';
  end if;

  if target_user_id = actor_id and target_role <> 'admin'::public.app_role then
    raise exception 'self-demotion is not allowed';
  end if;

  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'target user does not exist';
  end if;

  -- Preserve the account-level is_active state
  select coalesce(
    (select is_active from public.user_roles where user_id = target_user_id limit 1),
    true
  ) into existing_is_active;

  -- Last-admin lockout: cannot remove admin role if only one active admin
  if target_role <> 'admin'::public.app_role and exists (
    select 1 from public.user_roles
    where user_id = target_user_id
      and role = 'admin'::public.app_role
  ) then
    select count(*)
    into active_admin_count
    from public.user_roles
    where role = 'admin'::public.app_role
      and is_active = true;

    if active_admin_count <= 1 then
      raise exception 'cannot demote the last active admin';
    end if;
  end if;

  -- Replace all roles with the single new role
  delete from public.user_roles where user_id = target_user_id;

  insert into public.user_roles (user_id, role, is_active, granted_by_user_id, updated_at)
  values (target_user_id, target_role, existing_is_active, actor_id, now())
  returning * into result_row;

  return result_row;
end;
$$;

-- Grant execute permissions for new functions
grant execute on function
  public.get_user_roles(),
  public.admin_assign_user_role(uuid, public.app_role),
  public.admin_revoke_user_role(uuid, public.app_role)
to authenticated;
