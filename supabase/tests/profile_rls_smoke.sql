-- Profile ownership and first-login path smoke checks for user-profile-create-update.
-- Execute in a SQL session with migration state applied.

begin;

-- Replace with real auth.users IDs present in your environment.
select set_config('app.test.customer_user_id', '11111111-1111-1111-1111-111111111111', true);
select set_config('app.test.admin_user_id', '33333333-3333-3333-3333-333333333333', true);

-- Ensure roles for smoke test principals.
insert into public.user_roles (user_id, role)
values
  (current_setting('app.test.customer_user_id')::uuid, 'customer'::public.app_role),
  (current_setting('app.test.admin_user_id')::uuid, 'admin'::public.app_role)
on conflict (user_id) do update
set role = excluded.role,
  updated_at = now();

-- Prepare customer profile row (mirrors first-login profile existence target).
insert into public.profiles (user_id, full_name, phone)
values (current_setting('app.test.customer_user_id')::uuid, 'Smoke Customer', null)
on conflict (user_id) do update
set full_name = excluded.full_name,
  phone = excluded.phone,
  updated_at = now();

-- Customer can read and update own profile.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.customer_user_id'), true);

select user_id, full_name, phone
from public.profiles
where user_id = current_setting('app.test.customer_user_id')::uuid;

update public.profiles
set full_name = 'Smoke Customer Updated',
  phone = '+15550000000',
  updated_at = now()
where user_id = current_setting('app.test.customer_user_id')::uuid;

-- Admin can read and update customer profile.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.admin_user_id'), true);

select user_id, full_name, phone
from public.profiles
where user_id = current_setting('app.test.customer_user_id')::uuid;

update public.profiles
set full_name = 'Smoke Admin Updated',
  phone = '+15559999999',
  updated_at = now()
where user_id = current_setting('app.test.customer_user_id')::uuid;

rollback;
