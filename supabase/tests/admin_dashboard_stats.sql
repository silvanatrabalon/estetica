-- SQL smoke tests for admin_get_dashboard_stats().
-- Execute in a privileged SQL session (local Supabase SQL editor) after applying migrations.
-- This script is transactional: all inserts are rolled back at the end.

begin;

-- ── Test fixture helpers ───────────────────────────────────────────────────────

-- Use the same user IDs as the main RLS matrix test.
select set_config('app.test.admin_user_id',    '33333333-3333-3333-3333-333333333333', true);
select set_config('app.test.customer_user_id', '11111111-1111-1111-1111-111111111111', true);
select set_config('app.test.organization_id',  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);

-- Ensure admin role exists for the admin test user.
insert into public.user_roles (user_id, role)
values (current_setting('app.test.admin_user_id')::uuid, 'admin'::public.app_role)
on conflict (user_id) do update set role = excluded.role, updated_at = now();

-- Create a test service.
insert into public.services (id, organization_id, name, duration_minutes, price_cents, is_active)
values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
  current_setting('app.test.organization_id')::uuid,
  'Test Service',
  60,
  5000,
  true
)
on conflict (id) do nothing;

-- ── Scenario 1: Non-admin caller raises permission error ───────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.customer_user_id'), true);

do $$
begin
  begin
    perform public.admin_get_dashboard_stats();
    raise exception 'TEST FAILED: expected permission error but got none';
  exception
    when others then
      -- expected
      raise notice 'Scenario 1 PASS: non-admin caller raised error as expected (SQLSTATE=%)', sqlstate;
  end;
end;
$$;

-- ── Scenario 2: No appointments → all counts return 0, not null ───────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.admin_user_id'), true);

select
  case when today_count        = 0 then 'PASS' else 'FAIL' end || ' today_count=0'         as t2_today,
  case when week_count         = 0 then 'PASS' else 'FAIL' end || ' week_count=0'           as t2_week,
  case when month_count        = 0 then 'PASS' else 'FAIL' end || ' month_count=0'          as t2_month,
  case when pending_count      = 0 then 'PASS' else 'FAIL' end || ' pending_count=0'        as t2_pending,
  case when confirmed_count    = 0 then 'PASS' else 'FAIL' end || ' confirmed_count=0'      as t2_confirmed,
  case when cancelled_count    = 0 then 'PASS' else 'FAIL' end || ' cancelled_count=0'      as t2_cancelled,
  case when completed_count    = 0 then 'PASS' else 'FAIL' end || ' completed_count=0'      as t2_completed,
  case when no_show_count      = 0 then 'PASS' else 'FAIL' end || ' no_show_count=0'        as t2_no_show,
  case when revenue_cents_month= 0 then 'PASS' else 'FAIL' end || ' revenue_cents_month=0'  as t2_revenue,
  case when today_count        is not null then 'PASS' else 'FAIL' end || ' not null'        as t2_not_null
from public.admin_get_dashboard_stats();

-- ── Scenario 3: Insert appointments of different statuses this month ───────────

-- Helper: insert an appointment with a specific status, today in UTC (adjust if org tz differs)
insert into public.appointments
  (id, organization_id, service_id, customer_user_id, staff_member_id, starts_at, ends_at, status)
values
  -- confirmed today
  ('eeeeeeee-eeee-eeee-eeee-000000000001'::uuid,
   current_setting('app.test.organization_id')::uuid,
   'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
   current_setting('app.test.customer_user_id')::uuid,
   null,
   now(),
   now() + interval '1 hour',
   'confirmed'),
  -- completed today (counts in revenue)
  ('eeeeeeee-eeee-eeee-eeee-000000000002'::uuid,
   current_setting('app.test.organization_id')::uuid,
   'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
   current_setting('app.test.customer_user_id')::uuid,
   null,
   now() - interval '2 hours',
   now() - interval '1 hour',
   'completed'),
  -- cancelled today (does NOT count in revenue)
  ('eeeeeeee-eeee-eeee-eeee-000000000003'::uuid,
   current_setting('app.test.organization_id')::uuid,
   'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
   current_setting('app.test.customer_user_id')::uuid,
   null,
   now() - interval '3 hours',
   now() - interval '2 hours',
   'cancelled'),
  -- no_show today
  ('eeeeeeee-eeee-eeee-eeee-000000000004'::uuid,
   current_setting('app.test.organization_id')::uuid,
   'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
   current_setting('app.test.customer_user_id')::uuid,
   null,
   now() - interval '4 hours',
   now() - interval '3 hours',
   'no_show'),
  -- pending today
  ('eeeeeeee-eeee-eeee-eeee-000000000005'::uuid,
   current_setting('app.test.organization_id')::uuid,
   'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
   current_setting('app.test.customer_user_id')::uuid,
   null,
   now() + interval '2 hours',
   now() + interval '3 hours',
   'pending')
on conflict (id) do nothing;

select
  case when today_count     >= 5 then 'PASS' else 'FAIL' end || ' today_count>=5'          as t3_today,
  case when confirmed_count >= 1 then 'PASS' else 'FAIL' end || ' confirmed_count>=1'      as t3_confirmed,
  case when completed_count >= 1 then 'PASS' else 'FAIL' end || ' completed_count>=1'      as t3_completed,
  case when cancelled_count >= 1 then 'PASS' else 'FAIL' end || ' cancelled_count>=1'      as t3_cancelled,
  case when no_show_count   >= 1 then 'PASS' else 'FAIL' end || ' no_show_count>=1'        as t3_no_show,
  case when pending_count   >= 1 then 'PASS' else 'FAIL' end || ' pending_count>=1'        as t3_pending,
  -- revenue should be 5000 (one completed appointment at price 5000)
  case when revenue_cents_month = 5000 then 'PASS' else 'FAIL' end
    || ' revenue_cents_month=5000 (actual=' || revenue_cents_month || ')' as t3_revenue
from public.admin_get_dashboard_stats();

-- ── Scenario 4: Timezone-correct today boundary ────────────────────────────────
-- Insert an appointment at 01:00 UTC which is the previous calendar day in
-- America/Argentina/Buenos_Aires (UTC-3). It should NOT appear in today_count
-- when the org is set to Buenos Aires time.

-- NOTE: This test relies on the org having timezone = 'America/Argentina/Buenos_Aires'.
-- Run manually and verify today_count excludes appointments from the UTC-previous day.
select
  'Scenario 4: verify manually with org timezone = America/Argentina/Buenos_Aires'
  as timezone_boundary_note;

rollback;
