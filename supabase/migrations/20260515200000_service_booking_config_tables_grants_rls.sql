-- Service Booking Configuration: tables, column additions, grants, and RLS policies.
-- Covers three sub-concerns:
--   15a: service_available_dates table (per-service date whitelist)
--   15b: services.max_concurrent_bookings column
--   15c: organizations.booking_min_notice_minutes and booking_max_horizon_days columns

-- ──────────────────────────────────────────────────────────────────────────────
-- 15a: service_available_dates
-- Per-service calendar date whitelist.
-- Semantics: no rows → no date restriction; rows present → service only bookable on those dates.
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists public.service_available_dates (
  service_id       uuid        not null references public.services(id) on delete cascade,
  organization_id  uuid        not null references public.organizations(id),
  available_date   date        not null,
  created_at       timestamptz not null default now(),
  primary key (service_id, available_date)
);

create index if not exists idx_service_available_dates_service_id
  on public.service_available_dates (service_id);

grant select on public.service_available_dates to authenticated;

alter table public.service_available_dates enable row level security;

create policy "Authenticated users can read service_available_dates"
  on public.service_available_dates
  for select
  to authenticated
  using (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- 15b: services.max_concurrent_bookings
-- Nullable: null = no limit; integer >= 1 = enforce capacity.
-- ──────────────────────────────────────────────────────────────────────────────

alter table public.services
  add column if not exists max_concurrent_bookings integer
    check (max_concurrent_bookings is null or max_concurrent_bookings >= 1);

-- ──────────────────────────────────────────────────────────────────────────────
-- 15c: organizations booking policy columns
-- booking_min_notice_minutes: 0–10080 (0 = same-day allowed, 10080 = 1 week)
-- booking_max_horizon_days: 1–365
-- Both default to 60.
-- ──────────────────────────────────────────────────────────────────────────────

alter table public.organizations
  add column if not exists booking_min_notice_minutes integer default 60
    check (booking_min_notice_minutes >= 0 and booking_min_notice_minutes <= 10080),
  add column if not exists booking_max_horizon_days integer default 60
    check (booking_max_horizon_days >= 1 and booking_max_horizon_days <= 365);
