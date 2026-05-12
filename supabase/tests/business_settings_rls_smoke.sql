-- RLS smoke checks for singleton business settings behavior.
-- Execute manually in a privileged SQL environment after applying migrations.

begin;

select set_config('app.test.admin_user_id', '33333333-3333-3333-3333-333333333333', true);
select set_config('app.test.customer_user_id', '11111111-1111-1111-1111-111111111111', true);

insert into public.user_roles (user_id, role, is_active)
values
  (current_setting('app.test.admin_user_id')::uuid, 'admin'::public.app_role, true),
  (current_setting('app.test.customer_user_id')::uuid, 'customer'::public.app_role, true)
on conflict (user_id) do update
set role = excluded.role,
    is_active = excluded.is_active,
    updated_at = now();

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('app.test.admin_user_id'), true);

insert into public.organizations (name, slug, timezone)
values ('Negocio Principal', 'negocio-principal', 'UTC')
on conflict do nothing;

select count(*) as admin_can_read_business_hours
from public.business_hours;

insert into public.business_hours (organization_id, day_of_week, is_closed, opens_at, closes_at)
select id, 1, false, '09:00'::time, '18:00'::time
from public.organizations
limit 1
on conflict (organization_id, day_of_week) do update
set is_closed = excluded.is_closed,
    opens_at = excluded.opens_at,
    closes_at = excluded.closes_at,
    updated_at = now();

insert into public.business_closure_exceptions (organization_id, closure_date, closure_type, starts_at, ends_at, reason)
select id, date '2026-05-20', 'half_day', '13:00'::time, '17:00'::time, 'Capacitacion'
from public.organizations
limit 1;

select set_config('request.jwt.claim.sub', current_setting('app.test.customer_user_id'), true);

-- Expected: denied for non-admin write attempts
-- insert into public.business_hours (organization_id, day_of_week, is_closed, opens_at, closes_at)
-- select id, 2, false, '10:00'::time, '19:00'::time from public.organizations limit 1;

rollback;