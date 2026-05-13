-- Fix admin_list_staff_members to not duplicate rows when a staff member has multiple roles.
-- The previous JOIN with user_roles produced one row per role per staff member.
-- Now we use a subquery to pick the highest-privilege role (same precedence as current_app_role).

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
    coalesce(
      (
        select ur.role
        from public.user_roles ur
        where ur.user_id = sm.profile_user_id
          and ur.is_active = true
        order by
          case ur.role
            when 'admin'    then 1
            when 'staff'    then 2
            when 'customer' then 3
            else 4
          end
        limit 1
      ),
      'customer'::public.app_role
    ) as role
  from public.staff_members sm
  left join public.profiles p on p.user_id = sm.profile_user_id
  where public.is_admin()
    -- Only include staff members whose linked user has the 'staff' role.
    -- Admin is a system role and does not require availability configuration.
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
