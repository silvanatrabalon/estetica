-- Business settings profile foundation for the single-tenant salon.
-- Adds canonical business branding, weekly hours, half-day/full-day closures,
-- and singleton business enforcement.

alter table public.organizations
  add column if not exists logo_url text,
  add column if not exists brand_primary_color text,
  add column if not exists booking_header_text text,
  add column if not exists booking_subtitle_text text;

create unique index if not exists ux_singleton_organization
  on public.organizations ((true));

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  day_of_week integer not null check (day_of_week >= 0 and day_of_week <= 6),
  is_closed boolean not null default true,
  opens_at time,
  closes_at time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, day_of_week),
  check (
    (is_closed = true and opens_at is null and closes_at is null)
    or
    (is_closed = false and opens_at is not null and closes_at is not null and opens_at < closes_at)
  )
);

create table if not exists public.business_closure_exceptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  closure_date date not null,
  closure_type text not null check (closure_type in ('full_day', 'half_day')),
  starts_at time,
  ends_at time,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (closure_type = 'full_day' and starts_at is null and ends_at is null)
    or
    (closure_type = 'half_day' and starts_at is not null and ends_at is not null and starts_at < ends_at)
  )
);

create index if not exists idx_business_closure_exceptions_org_date
  on public.business_closure_exceptions (organization_id, closure_date);

create unique index if not exists ux_business_closure_exceptions_unique
  on public.business_closure_exceptions (
    organization_id,
    closure_date,
    closure_type,
    coalesce(starts_at, '00:00:00'::time),
    coalesce(ends_at, '00:00:00'::time)
  );

alter table public.business_hours enable row level security;
alter table public.business_closure_exceptions enable row level security;

revoke all on table public.business_hours, public.business_closure_exceptions from anon, authenticated;

grant select, insert, update, delete on table
  public.business_hours,
  public.business_closure_exceptions
to authenticated;

drop policy if exists business_hours_select_authenticated on public.business_hours;
create policy business_hours_select_authenticated
  on public.business_hours
  for select
  to authenticated
  using (true);

drop policy if exists business_hours_write_admin_only on public.business_hours;
create policy business_hours_write_admin_only
  on public.business_hours
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists business_closure_exceptions_select_authenticated on public.business_closure_exceptions;
create policy business_closure_exceptions_select_authenticated
  on public.business_closure_exceptions
  for select
  to authenticated
  using (true);

drop policy if exists business_closure_exceptions_write_admin_only on public.business_closure_exceptions;
create policy business_closure_exceptions_write_admin_only
  on public.business_closure_exceptions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
