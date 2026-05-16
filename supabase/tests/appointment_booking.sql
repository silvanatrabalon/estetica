-- Smoke tests for appointment-booking change.
-- Covers: create_appointment RPC, appointments RLS, exclusion constraint.
-- Run in a privileged SQL session (e.g., local Supabase SQL editor) after
-- applying the appointment-booking migrations.
--
-- These are manual inspection tests: review output to verify correctness.
-- Uses ROLLBACK to leave the database unchanged.

begin;

-- ─── Test fixture IDs ────────────────────────────────────────────────────────
-- Replace these with real UUIDs from your local dev database.

select set_config('app.test.customer_user_id',  '11111111-1111-1111-1111-111111111111', true);
select set_config('app.test.customer2_user_id', '44444444-4444-4444-4444-444444444444', true);
select set_config('app.test.staff_user_id',     '22222222-2222-2222-2222-222222222222', true);
select set_config('app.test.admin_user_id',     '33333333-3333-3333-3333-333333333333', true);
select set_config('app.test.service_id',        'cccccccc-cccc-cccc-cccc-cccccccccccc', true);
select set_config('app.test.org_id',            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);

-- ─── 1. Confirm constraint and function exist ─────────────────────────────────

-- 1a: Exclusion constraint exists
select conname, contype
from pg_constraint
where conrelid = 'public.appointments'::regclass
  and conname = 'excl_appointments_staff_no_overlap';
-- Expected: 1 row, contype = 'x' (exclusion)

-- 1b: Unique index no longer exists
select indexname
from pg_indexes
where tablename = 'appointments'
  and indexname = 'ux_appointments_staff_exact_slot';
-- Expected: 0 rows (index was dropped)

-- 1c: create_appointment function exists and is SECURITY DEFINER
select p.proname, p.prosecdef
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'create_appointment';
-- Expected: 1 row; prosecdef = true

-- ─── 2. Setup: switch to authenticated customer context ───────────────────────

set local role authenticated;
select set_config('request.jwt.claim.sub',
  current_setting('app.test.customer_user_id'), true);

-- ─── 3.1 Successful booking returns confirmed appointment ─────────────────────

-- Use now() + 2 hours to satisfy booking_min_notice_minutes
-- Assumes: service exists with is_active=true, a staff member is assigned to
--          the service with no conflicts at this time slot.

-- 3.2 ends_at = starts_at + duration_minutes (verified by inspecting output)
select
  id,
  service_id,
  staff_member_id,
  starts_at,
  ends_at,
  status,
  created_at,
  -- Derived check: ends_at - starts_at should equal service duration
  (ends_at - starts_at) as duration_interval
from public.create_appointment(
  current_setting('app.test.service_id')::uuid,
  now() + interval '2 hours'
);
-- Expected: 1 row; status = 'confirmed'; duration_interval matches service.duration_minutes

-- ─── 3.3 Unauthenticated caller is denied ─────────────────────────────────────

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

-- Uncomment to verify: should raise P0001 BOOKING_UNAUTHORIZED or "permission denied"
-- select * from public.create_appointment(
--   current_setting('app.test.service_id')::uuid,
--   now() + interval '3 hours'
-- );

-- ─── Back to authenticated customer ──────────────────────────────────────────

set local role authenticated;
select set_config('request.jwt.claim.sub',
  current_setting('app.test.customer_user_id'), true);

-- ─── 3.4 BOOKING_NO_STAFF_AVAILABLE: all staff are occupied ──────────────────

-- To test: pre-insert a confirmed appointment for all staff members assigned
-- to the service for the same time window, then call create_appointment.
-- Manual setup required. Expected error: P0001 / BOOKING_NO_STAFF_AVAILABLE.

-- ─── 3.5 BOOKING_CAPACITY_EXCEEDED: service at max capacity ──────────────────

-- To test: set services.max_concurrent_bookings = 1, insert one confirmed
-- appointment for that service, then call create_appointment for same window.
-- Manual setup required. Expected error: P0001 / BOOKING_CAPACITY_EXCEEDED.

-- ─── 3.6 BOOKING_OUTSIDE_POLICY_WINDOW: past slot ────────────────────────────

-- Past slot should raise BOOKING_OUTSIDE_POLICY_WINDOW
-- Uncomment to verify:
-- select * from public.create_appointment(
--   current_setting('app.test.service_id')::uuid,
--   now() - interval '1 day'
-- );
-- Expected error: P0001 / BOOKING_OUTSIDE_POLICY_WINDOW

-- ─── 3.7 Customer SELECT returns own appointment only ────────────────────────

-- Customer can see their own appointments
select count(*) as own_appointments
from public.appointments
where customer_user_id = auth.uid();
-- Expected: ≥ 1 (if booking in section 3.1 succeeded)

-- Customer CANNOT see another customer's appointments via RLS filter
-- (Rows for other customers simply don't appear — no error raised)

-- ─── 3.8 Staff/admin SELECT returns all org appointments ─────────────────────

set local role authenticated;
select set_config('request.jwt.claim.sub',
  current_setting('app.test.staff_user_id'), true);

select count(*) as all_org_appointments
from public.appointments;
-- Expected: returns all appointments in the org (staff sees all)

set local role authenticated;
select set_config('request.jwt.claim.sub',
  current_setting('app.test.admin_user_id'), true);

select count(*) as all_org_appointments_admin
from public.appointments;
-- Expected: same count as staff (admin sees all)

-- ─── Back to customer for constraint tests ───────────────────────────────────

set local role authenticated;
select set_config('request.jwt.claim.sub',
  current_setting('app.test.customer_user_id'), true);

-- ─── 3.9 Exclusion constraint blocks overlapping booking for same staff ───────

-- To test directly via INSERT (bypassing RPC):
-- Insert a confirmed appointment, then try inserting another for the same
-- staff member with overlapping times.
-- Expected: ERROR 23P01 exclusion constraint violation.

-- ─── 3.10 Back-to-back booking succeeds (half-open [) interval) ───────────────

-- If staff member ends at T, a new booking starting at T is NOT an overlap.
-- Use create_appointment for the immediately following slot.
-- Manual setup required with known staff availability.

-- ─── 3.11 Cancelled appointment does NOT block new booking ────────────────────

-- Insert a cancelled appointment for a staff member, then create_appointment
-- for the same window. Expected: succeeds (cancelled rows excluded from constraint).

do $$
declare
  v_staff_id uuid;
  v_org_id   uuid;
  v_svc_id   uuid := current_setting('app.test.service_id')::uuid;
begin
  select id into v_org_id from public.organizations limit 1;
  select sm.id into v_staff_id
    from public.staff_members sm
    join public.staff_services ss on ss.staff_member_id = sm.id
   where ss.service_id = v_svc_id and sm.is_active = true
   limit 1;

  if v_staff_id is not null and v_org_id is not null then
    -- Insert a cancelled appointment (should not block)
    insert into public.appointments (
      organization_id, service_id, staff_member_id,
      customer_user_id, created_by_user_id,
      starts_at, ends_at, status
    ) values (
      v_org_id, v_svc_id, v_staff_id,
      auth.uid(), auth.uid(),
      now() + interval '4 hours',
      now() + interval '4 hours' + interval '30 minutes',
      'cancelled'
    );
    raise notice 'Cancelled appointment inserted. Constraint should not block new booking at same window.';
  else
    raise notice 'No staff/org found for test. Skipping 3.11.';
  end if;
end $$;

-- ─── 3.12 Two different staff can have overlapping appointments ───────────────

-- Each staff member's GIST entry is keyed by (staff_member_id, range).
-- Two different staff with same time window do not conflict.
-- Manual verification: insert two confirmed appointments for same window, different staff.

-- ─── 3.13 Null max_concurrent_bookings skips capacity check ──────────────────

-- Service with max_concurrent_bookings IS NULL should allow unlimited bookings
-- (as long as staff are available). Verify by creating multiple appointments
-- for different staff with a null-capacity service.

select 'Smoke tests complete — review output above' as result;

-- ─── 4. get_appointment RPC smoke tests ──────────────────────────────────────

-- 4.1 get_appointment: function exists and is SECURITY DEFINER
select p.proname, p.prosecdef
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'get_appointment';
-- Expected: 1 row; prosecdef = true

-- Switch to owner customer context
set local role authenticated;
select set_config('request.jwt.claim.sub',
  current_setting('app.test.customer_user_id'), true);

-- 4.2 get_appointment: owner retrieves their appointment (requires an appointment
-- from section 3.1 to have been created; inspect manually)
-- After running 3.1 above, copy the returned appointment ID here:
-- select * from public.get_appointment('<appointment-id-from-3.1>');
-- Expected: 1 row with service_name, staff_display_name, org_name populated

-- 4.3 get_appointment: non-owner gets empty result (no error)
-- Set to customer2 and attempt to retrieve customer1's appointment:
set local role authenticated;
select set_config('request.jwt.claim.sub',
  current_setting('app.test.customer2_user_id'), true);

-- Replace <customer1-appointment-id> with the ID from 3.1:
-- select count(*) as rows_returned
-- from public.get_appointment('<customer1-appointment-id>');
-- Expected: 0 rows, no error raised

-- 4.4 get_appointment: staff can retrieve any appointment
set local role authenticated;
select set_config('request.jwt.claim.sub',
  current_setting('app.test.staff_user_id'), true);

-- Replace <customer1-appointment-id> with a real ID:
-- select * from public.get_appointment('<customer1-appointment-id>');
-- Expected: 1 row (staff sees all org appointments)

-- 4.5 get_appointment: unknown UUID returns empty (no error)
set local role authenticated;
select set_config('request.jwt.claim.sub',
  current_setting('app.test.customer_user_id'), true);

select count(*) as rows_returned
from public.get_appointment('00000000-0000-0000-0000-000000000000');
-- Expected: 0 rows (UUID doesn't exist — empty result, no error)

-- 4.6 get_appointment: unauthenticated caller denied
-- Uncomment to verify:
-- set local role anon;
-- select set_config('request.jwt.claim.sub', '', true);
-- select * from public.get_appointment('00000000-0000-0000-0000-000000000000');
-- Expected: permission denied error

-- ─── 5. list_appointments RPC smoke tests ────────────────────────────────────

-- 5.1 list_appointments function exists and is SECURITY DEFINER
select p.proname, p.prosecdef
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'list_appointments';
-- Expected: 1 row; prosecdef = true

-- 5.2 Customer sees only own appointments
set local role authenticated;
select set_config('request.jwt.claim.sub',
  current_setting('app.test.customer_user_id'), true);

-- All returned rows must belong to this customer
select count(*) filter (
    where customer_user_id != current_setting('app.test.customer_user_id')::uuid
  ) as foreign_rows_count
from public.list_appointments();
-- Expected: 0 (no foreign rows)

-- 5.3 Staff sees only assigned appointments
set local role authenticated;
select set_config('request.jwt.claim.sub',
  current_setting('app.test.staff_user_id'), true);

-- Returns at most 200 rows; all joined fields present (inspect manually)
-- select id, service_name, staff_display_name, customer_name, org_timezone
-- from public.list_appointments();
-- Expected: rows where the staff member is assigned to the appointment

-- 5.4 Non-owner customer (customer2) gets no data from customer1's appointments
set local role authenticated;
select set_config('request.jwt.claim.sub',
  current_setting('app.test.customer2_user_id'), true);

select count(*) filter (
    where customer_user_id = current_setting('app.test.customer_user_id')::uuid
  ) as customer1_rows_visible
from public.list_appointments();
-- Expected: 0 (customer2 cannot see customer1's appointments)

-- 5.5 Admin sees all org appointments
set local role authenticated;
select set_config('request.jwt.claim.sub',
  current_setting('app.test.admin_user_id'), true);

-- Inspect count — admin should see all appointments
-- select count(*) from public.list_appointments();
-- Expected: total count of all org appointments (up to 200)

-- 5.6 Joined fields are populated correctly (inspect manually)
-- select service_name, staff_display_name, customer_name, org_name, org_timezone
-- from public.list_appointments()
-- limit 5;
-- Expected: no null values in service_name, staff_display_name, org_name, org_timezone
-- customer_name may be null if profile record has no full_name

-- 5.7 Unauthenticated caller denied
-- Uncomment to verify:
-- set local role anon;
-- select set_config('request.jwt.claim.sub', '', true);
-- select * from public.list_appointments();
-- Expected: permission denied error

rollback;
