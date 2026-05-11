-- RLS role matrix validation scenarios for role-system-row-level-security.
-- Execute in a privileged SQL session (e.g., local Supabase SQL editor) after
-- applying migrations.

begin;

-- ---------------------------------------------------------------------------
-- Test fixture guidance
-- ---------------------------------------------------------------------------
-- 1) Ensure these UUIDs exist in auth.users in your local environment.
-- 2) Insert baseline organizations/services/staff/appointments as needed.
-- 3) Keep this script transactional and rollback after inspection.

-- Replace with real auth.users IDs.
select set_config('app.test.customer_user_id', '11111111-1111-1111-1111-111111111111', true);
select set_config('app.test.staff_user_id', '22222222-2222-2222-2222-222222222222', true);
select set_config('app.test.admin_user_id', '33333333-3333-3333-3333-333333333333', true);

-- Replace with an existing organization_id.
select set_config('app.test.organization_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);

-- Upsert app roles for test users.
insert into public.user_roles (user_id, role)
values
	(current_setting('app.test.customer_user_id')::uuid, 'customer'::public.app_role),
	(current_setting('app.test.staff_user_id')::uuid, 'staff'::public.app_role),
	(current_setting('app.test.admin_user_id')::uuid, 'admin'::public.app_role)
on conflict (user_id) do update
set role = excluded.role,
	updated_at = now();

-- Ensure staff user can operate in target organization.
insert into public.organization_memberships (organization_id, user_id, role)
values (
	current_setting('app.test.organization_id')::uuid,
	current_setting('app.test.staff_user_id')::uuid,
	'staff'
)
on conflict (organization_id, user_id) do update
set role = excluded.role;

-- ---------------------------------------------------------------------------
-- Scenario A: Unauthenticated context
-- Expected: public reads allowed only for public tables/policies.
-- ---------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

-- Should succeed if table has explicit public-read policy.
select count(*) as public_services_visible from public.services;
select count(*) as public_staff_visible from public.staff_members;

-- Should return zero rows if no public policy exists.
select count(*) as public_profiles_visible from public.profiles;
select count(*) as public_memberships_visible from public.organization_memberships;
select count(*) as public_appointments_visible from public.appointments;

-- ---------------------------------------------------------------------------
-- Scenario B: Customer context
-- Expected: customer cannot perform privileged staff/admin actions.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.customer_user_id'), true);

select public.current_app_role() as customer_effective_role;

-- Customer can read public data.
select count(*) as customer_services_visible from public.services;

-- Customer should not be able to create privileged resources.
-- Expect permission denied / RLS violation when organization_id is unmanaged.
-- Uncomment to verify failure behavior:
-- insert into public.services (organization_id, name, duration_minutes, price_cents)
-- values (current_setting('app.test.organization_id')::uuid, 'Blocked Service', 30, 1000);

-- ---------------------------------------------------------------------------
-- Scenario C: Staff context
-- Expected: staff can operate org-scoped resources, but not admin-only actions.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.staff_user_id'), true);

select public.current_app_role() as staff_effective_role;

-- Staff read and operational write should pass for managed org.
select count(*) as staff_services_visible from public.services;

-- Admin-only action should fail.
-- Uncomment to verify failure behavior:
-- update public.user_roles
-- set role = 'admin'::public.app_role
-- where user_id = current_setting('app.test.customer_user_id')::uuid;

-- ---------------------------------------------------------------------------
-- Scenario D: Admin context
-- Expected: admin can perform privileged operations.
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.admin_user_id'), true);

select public.current_app_role() as admin_effective_role;

-- Admin can read all role mappings.
select count(*) as admin_user_roles_visible from public.user_roles;

-- Admin can manage roles.
update public.user_roles
set role = 'customer'::public.app_role,
	updated_at = now()
where user_id = current_setting('app.test.customer_user_id')::uuid;

rollback;
