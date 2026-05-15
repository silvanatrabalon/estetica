-- staff_services junction table, indexes, grants, and RLS.
-- Follows the pattern established in staff-availability-configuration and services-catalog-admin.

-- ──────────────────────────────────────────────────────────────────────────────
-- Table
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists public.staff_services (
  staff_member_id  uuid        not null references public.staff_members(id) on delete cascade,
  service_id       uuid        not null references public.services(id)       on delete cascade,
  organization_id  uuid        not null references public.organizations(id),
  created_at       timestamptz not null default now(),
  primary key (staff_member_id, service_id)
);

-- ──────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────────────────────────────────────

-- Booking flow: filter staff by service
create index if not exists idx_staff_services_service_staff
  on public.staff_services (service_id, staff_member_id);

-- Admin panel: list services per staff member
create index if not exists idx_staff_services_staff_member
  on public.staff_services (staff_member_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Grants
-- ──────────────────────────────────────────────────────────────────────────────

grant select on public.staff_services to authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────────────────────────────────────

alter table public.staff_services enable row level security;

-- All authenticated users can read assignments (needed by booking flow).
-- No direct DML — all writes go through SECURITY DEFINER admin RPCs.
create policy staff_services_select_authenticated
  on public.staff_services
  for select
  to authenticated
  using (true);
