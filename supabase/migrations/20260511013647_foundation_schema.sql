-- Foundation schema for MVP-first features.
-- Scope intentionally excludes auth flow implementation and business-specific RLS policies.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
	id uuid primary key default gen_random_uuid(),
	name text not null check (char_length(trim(name)) >= 2),
	slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	timezone text not null default 'UTC',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
	user_id uuid primary key references auth.users(id) on delete cascade,
	full_name text,
	avatar_url text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
	id uuid primary key default gen_random_uuid(),
	organization_id uuid not null references public.organizations(id) on delete cascade,
	user_id uuid not null references auth.users(id) on delete cascade,
	role text not null default 'member' check (role in ('owner', 'admin', 'staff', 'member')),
	created_at timestamptz not null default now(),
	unique (organization_id, user_id)
);

create table if not exists public.staff_members (
	id uuid primary key default gen_random_uuid(),
	organization_id uuid not null references public.organizations(id) on delete cascade,
	profile_user_id uuid references auth.users(id) on delete set null,
	display_name text not null check (char_length(trim(display_name)) >= 2),
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.services (
	id uuid primary key default gen_random_uuid(),
	organization_id uuid not null references public.organizations(id) on delete cascade,
	name text not null check (char_length(trim(name)) >= 2),
	duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 480),
	price_cents integer not null default 0 check (price_cents >= 0),
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (organization_id, name)
);

create table if not exists public.appointments (
	id uuid primary key default gen_random_uuid(),
	organization_id uuid not null references public.organizations(id) on delete cascade,
	service_id uuid not null references public.services(id) on delete restrict,
	staff_member_id uuid not null references public.staff_members(id) on delete restrict,
	customer_user_id uuid references auth.users(id) on delete set null,
	created_by_user_id uuid not null references auth.users(id) on delete restrict,
	starts_at timestamptz not null,
	ends_at timestamptz not null,
	status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
	notes text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	check (ends_at > starts_at)
);

create index if not exists idx_profiles_created_at
	on public.profiles (created_at desc);

create index if not exists idx_org_memberships_user_id
	on public.organization_memberships (user_id);

create index if not exists idx_org_memberships_org_role
	on public.organization_memberships (organization_id, role);

create index if not exists idx_staff_members_org_active
	on public.staff_members (organization_id, is_active);

create unique index if not exists ux_staff_members_org_profile_user
	on public.staff_members (organization_id, profile_user_id)
	where profile_user_id is not null;

create index if not exists idx_services_org_active
	on public.services (organization_id, is_active);

create index if not exists idx_appointments_org_starts_at
	on public.appointments (organization_id, starts_at);

create index if not exists idx_appointments_staff_starts_at
	on public.appointments (staff_member_id, starts_at)
	where status in ('pending', 'confirmed');

create index if not exists idx_appointments_customer_starts_at
	on public.appointments (customer_user_id, starts_at)
	where customer_user_id is not null;

create unique index if not exists ux_appointments_staff_exact_slot
	on public.appointments (staff_member_id, starts_at)
	where status in ('pending', 'confirmed');

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.staff_members enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

revoke all on table
	public.organizations,
	public.profiles,
	public.organization_memberships,
	public.staff_members,
	public.services,
	public.appointments
from anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
