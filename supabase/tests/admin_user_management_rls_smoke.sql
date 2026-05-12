-- RLS smoke checks for admin user management RPCs.
-- Execute manually in privileged SQL environment after applying migrations.

begin;

select set_config('app.test.customer_user_id', '11111111-1111-1111-1111-111111111111', true);
select set_config('app.test.admin_user_id', '33333333-3333-3333-3333-333333333333', true);

insert into public.user_roles (user_id, role, is_active)
values
  (current_setting('app.test.customer_user_id')::uuid, 'customer'::public.app_role, true),
  (current_setting('app.test.admin_user_id')::uuid, 'admin'::public.app_role, true)
on conflict (user_id) do update
set role = excluded.role,
    is_active = excluded.is_active,
    updated_at = now();

-- Admin context can list users and mutate role/status.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.admin_user_id'), true);

select count(*) as admin_can_list_users
from public.admin_list_users();

select (public.admin_update_user_role(
  current_setting('app.test.customer_user_id')::uuid,
  'staff'::public.app_role
)).role as admin_updated_role;

select (public.admin_set_user_active(
  current_setting('app.test.customer_user_id')::uuid,
  false
)).is_active as admin_deactivated_user;

-- Non-admin context should be denied for mutation RPCs.
select set_config('request.jwt.claim.sub', current_setting('app.test.customer_user_id'), true);

-- Expected: error "only admin users can change roles"
-- select public.admin_update_user_role(current_setting('app.test.admin_user_id')::uuid, 'customer'::public.app_role);

-- Expected: error "only admin users can change activation state"
-- select public.admin_set_user_active(current_setting('app.test.admin_user_id')::uuid, false);

rollback;
