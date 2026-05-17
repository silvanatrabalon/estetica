-- Service categories: new table, category_id FK on services, public RLS, grants.
-- Part of change: service-categories

-- ─── Table ────────────────────────────────────────────────────────────────────

create table public.service_categories (
  id               uuid        primary key default gen_random_uuid(),
  organization_id  uuid        not null references public.organizations(id) on delete cascade,
  name             text        not null,
  display_order    integer     not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint service_categories_org_name_unique unique (organization_id, name)
);

alter table public.service_categories enable row level security;

-- ─── category_id FK on services ───────────────────────────────────────────────

alter table public.services
  add column if not exists category_id uuid
    references public.service_categories(id) on delete set null;

-- ─── RLS: public read ─────────────────────────────────────────────────────────

drop policy if exists service_categories_public_read on public.service_categories;
create policy service_categories_public_read
  on public.service_categories
  for select
  to anon, authenticated
  using (true);

-- ─── Grants ───────────────────────────────────────────────────────────────────

grant select on public.service_categories to anon;
grant select on public.service_categories to authenticated;
