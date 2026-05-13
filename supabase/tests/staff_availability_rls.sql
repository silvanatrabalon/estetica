-- Smoke tests for staff_schedules and staff_schedule_exceptions RLS and RPC functions.
-- Run in a privileged SQL session (e.g., Supabase SQL editor) after applying migrations.
-- This script is transactional — rollback at the end to leave no test data.

begin;

-- ──────────────────────────────────────────────────────────────────────────────
-- Fixture setup
-- ──────────────────────────────────────────────────────────────────────────────

select set_config('app.test.admin_user_id',    '33333333-3333-3333-3333-333333333333', true);
select set_config('app.test.staff_user_id',    '22222222-2222-2222-2222-222222222222', true);
select set_config('app.test.customer_user_id', '11111111-1111-1111-1111-111111111111', true);
select set_config('app.test.organization_id',  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);

-- Insert a test staff member (assumes staff_members table and organization exist).
insert into public.staff_members (id, organization_id, display_name, is_active)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd',
        current_setting('app.test.organization_id')::uuid,
        'Test Staff Availability',
        true)
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────────────────────────
-- Scenario 1: Unauthenticated user cannot SELECT from staff_schedules
-- Expected: 0 rows returned (RLS blocks anon)
-- ──────────────────────────────────────────────────────────────────────────────
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select count(*) as anon_schedule_visible from public.staff_schedules;

-- ──────────────────────────────────────────────────────────────────────────────
-- Scenario 2: Authenticated user can SELECT from staff_schedules
-- Expected: query succeeds (no error), count >= 0
-- ──────────────────────────────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.staff_user_id'), true);
select count(*) as auth_schedule_visible from public.staff_schedules;

-- ──────────────────────────────────────────────────────────────────────────────
-- Scenario 3: Authenticated user cannot direct-INSERT into staff_schedules
-- Expected: permission denied error
-- ──────────────────────────────────────────────────────────────────────────────
set local role authenticated;
do $$
begin
  insert into public.staff_schedules (staff_member_id, day_of_week, is_working)
  values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 1, false);
  raise exception 'TEST FAILED: direct insert should be denied';
exception
  when insufficient_privilege then
    raise notice 'PASS: direct INSERT on staff_schedules denied for authenticated role';
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Scenario 4: Admin can call admin_set_staff_schedule via RPC
-- Expected: returns 7 rows (one per day)
-- ──────────────────────────────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.admin_user_id'), true);

-- Temporarily set is_admin() to return true for test admin.
-- (Assumes is_admin() checks user_roles table — admin user must have admin role.)
insert into public.user_roles (user_id, role)
values (current_setting('app.test.admin_user_id')::uuid, 'admin')
on conflict (user_id) do update set role = 'admin';

select count(*) as rows_saved
from public.admin_set_staff_schedule(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '[
    {"day_of_week": 0, "is_working": false},
    {"day_of_week": 1, "is_working": true, "starts_at": "09:00", "ends_at": "17:00"},
    {"day_of_week": 2, "is_working": true, "starts_at": "09:00", "ends_at": "17:00"},
    {"day_of_week": 3, "is_working": true, "starts_at": "09:00", "ends_at": "17:00"},
    {"day_of_week": 4, "is_working": true, "starts_at": "09:00", "ends_at": "17:00"},
    {"day_of_week": 5, "is_working": true, "starts_at": "09:00", "ends_at": "13:00"},
    {"day_of_week": 6, "is_working": false}
  ]'::jsonb
);
-- Expected: 7

-- ──────────────────────────────────────────────────────────────────────────────
-- Scenario 5: Non-admin cannot call admin_set_staff_schedule
-- Expected: raises 'No autorizado'
-- ──────────────────────────────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.customer_user_id'), true);

insert into public.user_roles (user_id, role)
values (current_setting('app.test.customer_user_id')::uuid, 'customer')
on conflict (user_id) do update set role = 'customer';

do $$
begin
  perform public.admin_set_staff_schedule(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '[]'::jsonb
  );
  raise exception 'TEST FAILED: non-admin should not be able to call admin_set_staff_schedule';
exception
  when others then
    if sqlerrm like '%No autorizado%' then
      raise notice 'PASS: non-admin blocked from admin_set_staff_schedule';
    else
      raise exception 'TEST FAILED: unexpected error: %', sqlerrm;
    end if;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Scenario 6: Admin can upsert exception
-- Expected: row returned with correct exception_type
-- ──────────────────────────────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.admin_user_id'), true);

select exception_type, exception_date
from public.admin_upsert_staff_schedule_exception(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '2025-12-25',
  'day_off',
  null,
  null,
  'Navidad'
);
-- Expected: day_off, 2025-12-25

-- ──────────────────────────────────────────────────────────────────────────────
-- Scenario 7: Admin can delete exception
-- Expected: returns the deleted row id (non-null uuid)
-- ──────────────────────────────────────────────────────────────────────────────
select public.admin_delete_staff_schedule_exception(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '2025-12-25'
) as deleted_id;
-- Expected: non-null uuid

-- ──────────────────────────────────────────────────────────────────────────────
-- Scenario 8: CHECK constraint blocks is_working=true with null times
-- Expected: check violation
-- ──────────────────────────────────────────────────────────────────────────────
set local role postgres;
do $$
begin
  insert into public.staff_schedules (staff_member_id, day_of_week, is_working, starts_at, ends_at)
  values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 1, true, null, null);
  raise exception 'TEST FAILED: check constraint should have fired';
exception
  when check_violation then
    raise notice 'PASS: check constraint blocked is_working=true with null times';
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Scenario 9: CHECK constraint blocks starts_at >= ends_at
-- Expected: check violation
-- ──────────────────────────────────────────────────────────────────────────────
do $$
begin
  insert into public.staff_schedules (staff_member_id, day_of_week, is_working, starts_at, ends_at)
  values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 1, true, '18:00', '09:00');
  raise exception 'TEST FAILED: check constraint should have fired';
exception
  when check_violation then
    raise notice 'PASS: check constraint blocked starts_at >= ends_at';
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Scenario 10: UNIQUE constraint blocks duplicate (staff_member_id, day_of_week)
-- Expected: unique violation
-- ──────────────────────────────────────────────────────────────────────────────
do $$
begin
  insert into public.staff_schedules (staff_member_id, day_of_week, is_working, starts_at, ends_at)
  values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 1, true, '09:00', '17:00');
  insert into public.staff_schedules (staff_member_id, day_of_week, is_working, starts_at, ends_at)
  values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 1, true, '10:00', '18:00');
  raise exception 'TEST FAILED: unique constraint should have fired';
exception
  when unique_violation then
    raise notice 'PASS: unique constraint blocked duplicate (staff_member_id, day_of_week)';
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Scenario 11: Authenticated user can SELECT from staff_schedule_exceptions
-- Expected: count >= 0
-- ──────────────────────────────────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.staff_user_id'), true);
select count(*) as auth_exceptions_visible from public.staff_schedule_exceptions;

rollback;
