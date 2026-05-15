-- Services table grants and RLS policies.
-- The services table was created in the foundation schema with RLS enabled
-- and all direct grants revoked. This migration:
--   1. Adds the image_url column.
--   2. Grants SELECT to authenticated (for booking flow and admin display).
--   3. Creates a SELECT policy for all authenticated users.
--   4. No INSERT/UPDATE/DELETE policies — all mutations go through SECURITY DEFINER RPCs.

-- ──────────────────────────────────────────────────────────────────────────────
-- Schema extension
-- ──────────────────────────────────────────────────────────────────────────────

alter table public.services
  add column if not exists image_url text;

-- ──────────────────────────────────────────────────────────────────────────────
-- Grants
-- ──────────────────────────────────────────────────────────────────────────────

-- SELECT only; INSERT/UPDATE/DELETE go through SECURITY DEFINER functions
grant select on table public.services to authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- RLS policies
-- ──────────────────────────────────────────────────────────────────────────────

drop policy if exists services_select_authenticated on public.services;
create policy services_select_authenticated
  on public.services
  for select
  to authenticated
  using (true);
