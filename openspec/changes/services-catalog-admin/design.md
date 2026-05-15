## Context

The `services` table was defined in the foundation schema migration (`20260511013647_foundation_schema.sql`) with columns `id`, `organization_id`, `name`, `duration_minutes`, `price_cents`, `is_active`, `created_at`, `updated_at`. However, no RLS policies, no table grants, and no RPC functions were ever created for it. The `AdminServicesPage.tsx` at `/admin/services` exists as a placeholder (two lines of copy, no functionality). The route and navigation entry are already wired.

The established pattern for admin data management in this codebase is:
1. Two migrations: one for table grants + RLS policies, one for SECURITY DEFINER RPC functions
2. A TypeScript service layer in `src/services/` that wraps the RPCs
3. A page that uses the service layer directly (no custom hooks needed for simple CRUD)

This change adds `image_url text` (nullable) to `services`, establishes the RLS + grants layer, implements the four admin RPCs, and replaces the placeholder page.

## Goals / Non-Goals

**Goals:**
- Enable admins to fully manage the service catalog (create, edit, deactivate/reactivate)
- Add `image_url` as a nullable text column for optional service images (URL only)
- Grant authenticated users SELECT access to active services (needed for future booking flow)
- Follow the established RPC → service layer → page pattern exactly

**Non-Goals:**
- Staff-service assignment (no `staff_services` junction table in this change)
- Customer-facing service catalog page (belongs in #16 booking flow)
- Image file upload via Supabase Storage (URL pasting only)
- Service categories or manual sort ordering
- Multi-currency support (ARS hardcoded in frontend formatting)

## Decisions

### D1: Two migrations following the established split pattern

**Decision:** `20260515000000_services_tables_grants_rls.sql` (adds `image_url` column + grants + RLS policies) and `20260515000001_services_admin_rpc.sql` (SECURITY DEFINER functions).

**Rationale:** Matches the `staff_availability_tables` / `staff_availability_rpc` split used in #12. Keeps rollback granularity clean — if an RPC has a bug, only the RPC migration needs to be fixed without touching the schema.

**Alternative considered:** Single migration for everything. Rejected — mixes DDL with procedural logic, harder to reason about and harder to roll back selectively.

### D2: `image_url` as nullable text with no validation constraint in DB

**Decision:** `ALTER TABLE public.services ADD COLUMN image_url text;` — no CHECK constraint on URL format.

**Rationale:** URL validation is a frontend concern. Adding a regex CHECK in PostgreSQL is fragile (URLs have edge cases) and impossible to change without a migration. The frontend validates format on input; the DB column is intentionally permissive. Null means "no image".

**Alternative considered:** `CHECK (image_url ~ '^https?://')`. Rejected — too brittle for an MVP feature, blocks valid edge cases.

### D3: RLS SELECT policy grants access to all authenticated users (not just admin)

**Decision:** `CREATE POLICY "authenticated users can select services" ON public.services FOR SELECT TO authenticated USING (true);`

**Rationale:** Active services need to be visible to staff (for their own awareness) and customers (for booking, #16). Restricting SELECT to admin-only would require a policy change in a future migration just to enable the booking flow. Granting SELECT to all authenticated roles now is forward-compatible and follows the principle of least-surprise.

**Alternative considered:** Admin-only SELECT via `USING (is_admin())`. Rejected — unnecessarily restrictive; services are not sensitive data.

### D4: `AdminServicesPage` follows `AdminStaffPage` pattern exactly (inline form, no modal)

**Decision:** Inline create/edit form (show/hide state), list table below, deactivate/reactivate toggle in the row. No separate route for edit.

**Rationale:** The AdminStaffPage pattern is established, tested, and familiar. Introducing a modal or a separate edit route would be a new pattern for a feature that doesn't justify the added complexity.

### D5: Price formatted as ARS in frontend with hardcoded locale

**Decision:** `price_cents` displayed as `(price_cents / 100).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })`. Zero displays as `$0,00`.

**Rationale:** Single-tenant MVP with a known currency. The `organizations` table has no `currency_code` column (deferred per backlog decision). Hardcoding ARS is pragmatic and reversible — when currency becomes dynamic, only the formatting utility needs to change.

## Risks / Trade-offs

- **`image_url` is a free-text field** → admins could paste broken or HTTP (non-HTTPS) URLs. Mitigation: frontend validates URL format before submit; display shows image preview with an `onError` fallback to a placeholder icon.
- **No `image_url` constraint in DB** → invalid URLs can exist if inserted directly (e.g., via seed or direct SQL). Acceptable risk for MVP; the only write path is through the admin RPC which validates on the frontend first.
- **ARS hardcoded** → if the tenant changes currency, a code change is needed. Mitigation: the formatting is isolated to a single utility call in the page; easy to extract to a context value later.
- **`ON DELETE RESTRICT` on `appointments.service_id`** → deactivating a service does not delete it, so existing appointments are unaffected. However, admins cannot delete a service that has linked appointments — the UI must not offer a delete option (only deactivate).

## Migration Plan

1. Apply `20260515000000_services_tables_grants_rls.sql`: adds `image_url` column, revokes direct DML from `authenticated`, grants SELECT, creates RLS policies.
2. Apply `20260515000001_services_admin_rpc.sql`: creates the four SECURITY DEFINER functions.
3. Deploy frontend changes.
4. **Rollback:** Drop the two RPC functions, drop the RLS policies, revoke grants, drop `image_url` column. No data loss risk since `image_url` is nullable and services table was empty (no existing service data in production yet).

## Open Questions

*(none — all decisions resolved in BACKLOG.md before this proposal)*
