-- Bootstrap: create the base tables required by the RLS foundation migration.
-- The RLS foundation (20260510192000) was written assuming these tables already
-- existed in the database. This migration creates them first so the migration
-- sequence replays cleanly on a fresh start.
-- 
-- All CREATE TABLE statements use IF NOT EXISTS, so they are safe to run even
-- if the tables already exist (e.g., in the remote Supabase project). The full
-- table specification is in 20260511013647_foundation_schema.sql, which also
-- uses IF NOT EXISTS throughout.

create extension if not exists pgcrypto;

-- Organizations (no intra-public dependencies)
create table if not exists public.organizations (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null check (char_length(trim(name)) >= 2),
  slug       text        not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  timezone   text        not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Profiles (depends on auth.users)
create table if not exists public.profiles (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Organization memberships (depends on organizations, auth.users)
create table if not exists public.organization_memberships (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  user_id         uuid        not null references auth.users(id) on delete cascade,
  role            text        not null default 'member' check (role in ('owner', 'admin', 'staff', 'member')),
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- Staff members (depends on organizations, auth.users)
create table if not exists public.staff_members (
  id              uuid        primary key default gen_random_uuid(),
  organization_id uuid        not null references public.organizations(id) on delete cascade,
  profile_user_id uuid        references auth.users(id) on delete set null,
  display_name    text        not null check (char_length(trim(display_name)) >= 2),
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Services (depends on organizations)
create table if not exists public.services (
  id               uuid        primary key default gen_random_uuid(),
  organization_id  uuid        not null references public.organizations(id) on delete cascade,
  name             text        not null check (char_length(trim(name)) >= 2),
  duration_minutes integer     not null check (duration_minutes > 0 and duration_minutes <= 480),
  price_cents      integer     not null default 0 check (price_cents >= 0),
  is_active        boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, name)
);

-- Appointments (depends on organizations, services, staff_members, auth.users)
create table if not exists public.appointments (
  id                 uuid        primary key default gen_random_uuid(),
  organization_id    uuid        not null references public.organizations(id) on delete cascade,
  service_id         uuid        not null references public.services(id) on delete restrict,
  staff_member_id    uuid        not null references public.staff_members(id) on delete restrict,
  customer_user_id   uuid        references auth.users(id) on delete set null,
  created_by_user_id uuid        not null references auth.users(id) on delete restrict,
  starts_at          timestamptz not null,
  ends_at            timestamptz not null,
  status             text        not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (ends_at > starts_at)
);
