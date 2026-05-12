-- Admin user management panel foundation.
-- Adds reversible account activity state, safe admin mutations,
-- and admin-only RPCs for user directory and analytics.

alter table public.user_roles
  add column if not exists is_active boolean not null default true;

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
      else coalesce(
        (
          select ur.role
          from public.user_roles ur
          where ur.user_id = auth.uid()
        ),
        'customer'::public.app_role
      )
    end;
$$;

create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  full_name text,
  phone text,
  role public.app_role,
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
    coalesce(ur.role, 'customer'::public.app_role) as role,
    coalesce(ur.is_active, true) as is_active
  from auth.users u
  left join public.user_roles ur on ur.user_id = u.id
  left join public.profiles p on p.user_id = u.id
  where public.is_admin()
  order by u.created_at asc;
$$;

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
  with users_with_state as (
    select
      u.id,
      u.created_at,
      coalesce(ur.role, 'customer'::public.app_role) as role,
      coalesce(ur.is_active, true) as is_active
    from auth.users u
    left join public.user_roles ur on ur.user_id = u.id
  )
  select
    count(*) as total_users,
    count(*) filter (where is_active) as active_users,
    count(*) filter (where not is_active) as inactive_users,
    count(*) filter (where role = 'customer'::public.app_role) as customer_users,
    count(*) filter (where role = 'staff'::public.app_role) as staff_users,
    count(*) filter (where role = 'admin'::public.app_role) as admin_users,
    count(*) filter (where created_at >= now() - interval '30 days') as recent_signups_30_days
  from users_with_state
  where public.is_admin();
$$;

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
  actor_is_admin boolean;
  existing_role public.app_role;
  existing_is_active boolean;
  active_admin_count integer;
  updated_row public.user_roles;
begin
  actor_is_admin := public.is_admin();

  if actor_id is null then
    raise exception 'authenticated user is required';
  end if;

  if not actor_is_admin then
    raise exception 'only admin users can change roles';
  end if;

  if target_user_id = actor_id and target_role <> 'admin'::public.app_role then
    raise exception 'self-demotion is not allowed';
  end if;

  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'target user does not exist';
  end if;

  select ur.role, ur.is_active
  into existing_role, existing_is_active
  from public.user_roles ur
  where ur.user_id = target_user_id;

  existing_role := coalesce(existing_role, 'customer'::public.app_role);
  existing_is_active := coalesce(existing_is_active, true);

  if existing_role = 'admin'::public.app_role
    and existing_is_active
    and target_role <> 'admin'::public.app_role then
    select count(*)
    into active_admin_count
    from public.user_roles ur
    where ur.role = 'admin'::public.app_role
      and ur.is_active = true;

    if active_admin_count <= 1 then
      raise exception 'cannot demote the last active admin';
    end if;
  end if;

  insert into public.user_roles (user_id, role, is_active, granted_by_user_id, updated_at)
  values (target_user_id, target_role, existing_is_active, actor_id, now())
  on conflict (user_id)
  do update
    set role = excluded.role,
        granted_by_user_id = excluded.granted_by_user_id,
        updated_at = now()
  returning * into updated_row;

  return updated_row;
end;
$$;

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
  actor_is_admin boolean;
  existing_role public.app_role;
  existing_is_active boolean;
  active_admin_count integer;
  updated_row public.user_roles;
begin
  actor_is_admin := public.is_admin();

  if actor_id is null then
    raise exception 'authenticated user is required';
  end if;

  if not actor_is_admin then
    raise exception 'only admin users can change activation state';
  end if;

  if not exists (select 1 from auth.users where id = target_user_id) then
    raise exception 'target user does not exist';
  end if;

  select ur.role, ur.is_active
  into existing_role, existing_is_active
  from public.user_roles ur
  where ur.user_id = target_user_id;

  existing_role := coalesce(existing_role, 'customer'::public.app_role);
  existing_is_active := coalesce(existing_is_active, true);

  if existing_role = 'admin'::public.app_role
    and existing_is_active
    and make_active = false then
    select count(*)
    into active_admin_count
    from public.user_roles ur
    where ur.role = 'admin'::public.app_role
      and ur.is_active = true;

    if active_admin_count <= 1 then
      raise exception 'cannot deactivate the last active admin';
    end if;
  end if;

  insert into public.user_roles (user_id, role, is_active, granted_by_user_id, updated_at)
  values (target_user_id, existing_role, make_active, actor_id, now())
  on conflict (user_id)
  do update
    set is_active = excluded.is_active,
        granted_by_user_id = excluded.granted_by_user_id,
        updated_at = now()
  returning * into updated_row;

  return updated_row;
end;
$$;

grant execute on function
  public.admin_list_users(),
  public.admin_user_analytics(),
  public.admin_update_user_role(uuid, public.app_role),
  public.admin_set_user_active(uuid, boolean)
to authenticated;
