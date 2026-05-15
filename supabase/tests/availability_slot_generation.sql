-- Smoke tests for get_available_slots RPC.
-- Run in a privileged SQL session (e.g., local Supabase SQL editor) after
-- applying the availability-slot-generation migration.
--
-- These are manual inspection tests: look at output columns and row counts
-- to verify correctness. No pgTAP assertions — uses simple SELECT checks.

begin;

-- ─── Test fixture IDs ────────────────────────────────────────────────────────
-- Replace these with real UUIDs from your local dev database.

select set_config('app.test.customer_user_id', '11111111-1111-1111-1111-111111111111', true);
select set_config('app.test.staff_user_id',    '22222222-2222-2222-2222-222222222222', true);
select set_config('app.test.service_id',       'cccccccc-cccc-cccc-cccc-cccccccccccc', true);
select set_config('app.test.org_id',           'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);

-- ─── 1. Confirm the function exists and is SECURITY DEFINER ──────────────────

select
    p.proname                         as function_name,
    p.prosecdef                       as is_security_definer,
    p.provolatile                     as volatility
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'get_available_slots';

-- Expected: 1 row; is_security_definer = true; volatility = 's' (stable) or 'v'

-- ─── 2. anon role must NOT be able to call the function ──────────────────────

set local role anon;
select set_config('request.jwt.claim.sub', '', true);

-- This should raise "permission denied for function get_available_slots".
-- Uncomment to test manually — it will abort the transaction if uncommented:
-- select * from public.get_available_slots(
--     current_setting('app.test.service_id')::uuid,
--     current_date
-- );

-- ─── 3. Authenticated customer CAN call the function ─────────────────────────

set local role authenticated;
select set_config(
    'request.jwt.claim.sub',
    current_setting('app.test.customer_user_id'),
    true
);

-- Should return zero or more (starts_at, ends_at) rows without raising an error.
select count(*) as available_slot_count
from public.get_available_slots(
    current_setting('app.test.service_id')::uuid,
    current_date + interval '1 day'
);

-- ─── 4. Returned columns have correct types ───────────────────────────────────

select
    pg_typeof(starts_at) as starts_at_type,
    pg_typeof(ends_at)   as ends_at_type
from public.get_available_slots(
    current_setting('app.test.service_id')::uuid,
    current_date + interval '1 day'
)
limit 1;

-- Expected: both columns are 'timestamp with time zone'

-- ─── 5. All slots respect ordering (starts_at ascending) ─────────────────────

with slots as (
    select starts_at, ends_at, row_number() over (order by starts_at) as rn
    from public.get_available_slots(
        current_setting('app.test.service_id')::uuid,
        current_date + interval '1 day'
    )
)
select
    case
        when count(*) = 0                                         then 'PASS: no slots'
        when bool_and(starts_at >= lag(starts_at, 1, starts_at)
                      over (order by starts_at))                  then 'PASS: slots ordered'
        else                                                           'FAIL: out-of-order slots'
    end as ordering_check
from slots;

-- ─── 6. No slot ends after it starts ─────────────────────────────────────────

select
    case
        when count(*) = 0                         then 'PASS: no slots'
        when bool_and(ends_at > starts_at)        then 'PASS: ends_at > starts_at'
        else                                           'FAIL: end before start'
    end as ends_before_starts_check
from public.get_available_slots(
    current_setting('app.test.service_id')::uuid,
    current_date + interval '1 day'
);

-- ─── 7. All slots are in the future (notice cutoff) ──────────────────────────

select
    case
        when count(*) = 0            then 'PASS: no slots'
        when bool_and(starts_at > now()) then 'PASS: all in future'
        else                              'FAIL: past slot found'
    end as future_slots_check
from public.get_available_slots(
    current_setting('app.test.service_id')::uuid,
    current_date + interval '1 day'
);

-- ─── 8. Past date returns zero slots (policy horizon) ────────────────────────

select count(*) as past_date_slots
from public.get_available_slots(
    current_setting('app.test.service_id')::uuid,
    current_date - interval '1 day'
);

-- Expected: 0

-- ─── 9. Far-future date outside horizon returns zero slots ───────────────────

select count(*) as beyond_horizon_slots
from public.get_available_slots(
    current_setting('app.test.service_id')::uuid,
    current_date + interval '999 days'
);

-- Expected: 0

-- ─── Cleanup ─────────────────────────────────────────────────────────────────

rollback;
