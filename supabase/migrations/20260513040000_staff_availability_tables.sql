-- Staff availability tables.
-- staff_schedules: recurring weekly template per staff member (one row per weekday).
-- staff_schedule_exceptions: one-off date overrides per staff member.
-- Both parallel the business_hours / business_closure_exceptions structure.
-- All mutations go through SECURITY DEFINER RPCs (no direct DML from authenticated role).

-- ──────────────────────────────────────────────────────────────────────────────
-- staff_schedules
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists public.staff_schedules (
  id              uuid        primary key default gen_random_uuid(),
  staff_member_id uuid        not null references public.staff_members(id) on delete cascade,
  day_of_week     smallint    not null,
  is_working      boolean     not null default false,
  starts_at       time,
  ends_at         time,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint chk_staff_schedules_day_of_week check (day_of_week between 0 and 6),
  constraint chk_staff_schedules_hours check (
    (is_working = false and starts_at is null and ends_at is null)
    or
    (is_working = true and starts_at is not null and ends_at is not null and starts_at < ends_at)
  ),
  unique (staff_member_id, day_of_week)
);

create index if not exists idx_staff_schedules_staff_member_id
  on public.staff_schedules (staff_member_id);

create index if not exists idx_staff_schedules_working
  on public.staff_schedules (staff_member_id, day_of_week)
  where is_working = true;

-- ──────────────────────────────────────────────────────────────────────────────
-- staff_schedule_exceptions
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists public.staff_schedule_exceptions (
  id              uuid        primary key default gen_random_uuid(),
  staff_member_id uuid        not null references public.staff_members(id) on delete cascade,
  exception_date  date        not null,
  exception_type  text        not null,
  starts_at       time,
  ends_at         time,
  reason          text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint chk_staff_schedule_exceptions_type check (exception_type in ('day_off', 'custom_hours')),
  constraint chk_staff_schedule_exceptions_hours check (
    (exception_type = 'day_off' and starts_at is null and ends_at is null)
    or
    (exception_type = 'custom_hours' and starts_at is not null and ends_at is not null and starts_at < ends_at)
  ),
  unique (staff_member_id, exception_date)
);

create index if not exists idx_staff_schedule_exceptions_staff_date
  on public.staff_schedule_exceptions (staff_member_id, exception_date);

-- ──────────────────────────────────────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────────────────────────────────────

alter table public.staff_schedules enable row level security;
alter table public.staff_schedule_exceptions enable row level security;

-- authenticated SELECT only; no INSERT/UPDATE/DELETE policies (writes via SECURITY DEFINER RPCs)
grant select on table public.staff_schedules to authenticated;
grant select on table public.staff_schedule_exceptions to authenticated;

drop policy if exists staff_schedules_select_authenticated on public.staff_schedules;
create policy staff_schedules_select_authenticated
  on public.staff_schedules
  for select
  to authenticated
  using (true);

drop policy if exists staff_schedule_exceptions_select_authenticated on public.staff_schedule_exceptions;
create policy staff_schedule_exceptions_select_authenticated
  on public.staff_schedule_exceptions
  for select
  to authenticated
  using (true);
