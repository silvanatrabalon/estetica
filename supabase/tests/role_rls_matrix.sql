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

-- ---------------------------------------------------------------------------
-- Scenario E: staff_services RLS matrix
-- ---------------------------------------------------------------------------

-- Replace with real IDs that exist in staff_members and services.
select set_config('app.test.staff_member_id', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true);
select set_config('app.test.service_id',      'cccccccc-cccc-cccc-cccc-cccccccccccc', true);

-- E1: Authenticated non-admin can SELECT from staff_services.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.staff_user_id'), true);
select count(*) as staff_services_visible_by_staff from public.staff_services;

-- E2: Non-admin direct INSERT on staff_services is rejected by RLS (no INSERT policy).
-- Uncomment to verify failure:
-- insert into public.staff_services (staff_member_id, service_id, organization_id)
-- values (
--   current_setting('app.test.staff_member_id')::uuid,
--   current_setting('app.test.service_id')::uuid,
--   current_setting('app.test.organization_id')::uuid
-- );

-- E3: Non-admin direct DELETE on staff_services is rejected by RLS (no DELETE policy).
-- Uncomment to verify failure:
-- delete from public.staff_services
-- where staff_member_id = current_setting('app.test.staff_member_id')::uuid;

-- E4: Admin calling admin_assign_service_to_staff succeeds.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.admin_user_id'), true);
-- Expect the RPC to run without error when valid staff + service IDs exist.
-- select public.admin_assign_service_to_staff(
--   current_setting('app.test.staff_member_id')::uuid,
--   current_setting('app.test.service_id')::uuid
-- );

-- E5: Non-admin calling admin_assign_service_to_staff raises 'No autorizado'.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.staff_user_id'), true);
-- Uncomment to verify failure:
-- select public.admin_assign_service_to_staff(
--   current_setting('app.test.staff_member_id')::uuid,
--   current_setting('app.test.service_id')::uuid
-- );

-- ---------------------------------------------------------------------------
-- Scenario F: service_available_dates RLS matrix (service-booking-configuration)
-- ---------------------------------------------------------------------------

-- F1: Authenticated non-admin can SELECT from service_available_dates.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.staff_user_id'), true);
select count(*) as service_available_dates_visible_by_staff from public.service_available_dates;

-- F2: Non-admin direct INSERT on service_available_dates is rejected by RLS (no INSERT policy).
-- Uncomment to verify failure:
-- insert into public.service_available_dates (service_id, organization_id, available_date)
-- values (
--   current_setting('app.test.service_id')::uuid,
--   current_setting('app.test.organization_id')::uuid,
--   current_date
-- );

-- F3: CHECK constraint on services.max_concurrent_bookings rejects 0 and negatives; accepts null and >= 1.
-- Uncomment to verify failure (0 and negative rejected):
-- update public.services set max_concurrent_bookings = 0
-- where id = current_setting('app.test.service_id')::uuid;
-- update public.services set max_concurrent_bookings = -1
-- where id = current_setting('app.test.service_id')::uuid;
-- Verify success:
-- update public.services set max_concurrent_bookings = null
-- where id = current_setting('app.test.service_id')::uuid;
-- update public.services set max_concurrent_bookings = 1
-- where id = current_setting('app.test.service_id')::uuid;

-- F4: PK on (service_id, available_date) rejects duplicate inserts.
-- (Requires admin role and existing service to verify.)
-- Uncomment to verify failure:
-- select public.admin_add_service_available_date(
--   current_setting('app.test.service_id')::uuid, current_date
-- );
-- select public.admin_add_service_available_date(  -- duplicate → should raise unique_violation
--   current_setting('app.test.service_id')::uuid, current_date
-- );

-- F5: Admin RPC admin_add_service_available_date succeeds for admin; raises "No autorizado" for non-admin.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.admin_user_id'), true);
-- Uncomment to verify admin success:
-- select public.admin_add_service_available_date(
--   current_setting('app.test.service_id')::uuid, current_date + 1
-- );

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.staff_user_id'), true);
-- Uncomment to verify non-admin failure (should raise "No autorizado"):
-- select public.admin_add_service_available_date(
--   current_setting('app.test.service_id')::uuid, current_date + 2
-- );

-- F6: CHECK constraints on organizations.booking_min_notice_minutes and booking_max_horizon_days
-- reject out-of-range values.
-- Uncomment to verify failure:
-- update public.organizations set booking_min_notice_minutes = -1
-- where id = current_setting('app.test.organization_id')::uuid;
-- update public.organizations set booking_min_notice_minutes = 10081
-- where id = current_setting('app.test.organization_id')::uuid;
-- update public.organizations set booking_max_horizon_days = 0
-- where id = current_setting('app.test.organization_id')::uuid;
-- update public.organizations set booking_max_horizon_days = 366
-- where id = current_setting('app.test.organization_id')::uuid;

-- ---------------------------------------------------------------------------
-- cancel_appointment RPC scenarios
-- ---------------------------------------------------------------------------
-- Prerequisites: populate app.test.appointment_id with a 'pending' or
-- 'confirmed' appointment owned by the customer test user and assigned
-- to the staff test user, with starts_at well beyond booking_min_notice_minutes.
-- Replace with a real appointment UUID before executing.
select set_config('app.test.appointment_id', '00000000-0000-0000-0000-000000000001', true);

-- G1: Customer can cancel their own appointment (outside policy window).
-- Expected: returns 1 row with status='cancelled'.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.customer_user_id'), true);
-- Uncomment to verify success:
-- select * from public.cancel_appointment(current_setting('app.test.appointment_id')::uuid);

-- G2: Customer cannot cancel another customer's appointment.
-- Expected: raises CANCEL_NOT_AUTHORIZED.
-- (Use an appointment_id not owned by customer_user_id.)
-- Uncomment to verify failure:
-- select * from public.cancel_appointment('99999999-9999-9999-9999-999999999999'::uuid);

-- G3: Staff can cancel an assigned appointment.
-- Expected: returns 1 row with status='cancelled'.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.staff_user_id'), true);
-- Uncomment to verify success:
-- select * from public.cancel_appointment(current_setting('app.test.appointment_id')::uuid);

-- G4: Admin can cancel any appointment.
-- Expected: returns 1 row with status='cancelled'.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.admin_user_id'), true);
-- Uncomment to verify success:
-- select * from public.cancel_appointment(current_setting('app.test.appointment_id')::uuid);

-- G5: Already-cancelled appointment raises CANCEL_INVALID_STATUS.
-- (Re-run after G1/G3/G4 has already cancelled the appointment.)
-- Uncomment to verify failure:
-- select * from public.cancel_appointment(current_setting('app.test.appointment_id')::uuid);

-- G6: Customer cancellation within policy window raises CANCEL_OUTSIDE_POLICY_WINDOW.
-- (Use an appointment with starts_at < now() + booking_min_notice_minutes.)
-- Uncomment to verify failure:
-- set local role authenticated;
-- select set_config('request.jwt.claim.sub', current_setting('app.test.customer_user_id'), true);
-- select * from public.cancel_appointment('<near-future-appointment-id>'::uuid);

rollback;
