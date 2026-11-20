## Context

The app stores appointments with a `status` field that includes a `no_show` value via a CHECK constraint. However, the system has never had a way for staff or admins to mark an appointment as `no_show` — the status exists in schema but is dead in practice. Separately, the `business_closure_exceptions` table holds admin-defined closure dates but this data is never surfaced publicly. Admins also lack two important self-service operations: bulk-deleting appointment history and hard-deleting a user account. The dashboard analytics section only shows the current month without a date-range selector, limiting its utility. All five gaps are addressed in this change.

## Goals / Non-Goals

**Goals:**
- Remove `no_show_count` from `admin_get_dashboard_stats()` return type (breaking migration + atomic frontend deploy)
- Add `get_upcoming_closures()` public RPC and render closure banners/list on the landing page
- Add `admin_delete_all_appointments()` RPC and danger zone UI in business settings
- Add `admin_get_stats_by_range(p_date_from, p_date_to)` RPC and date-range analytics UI in the dashboard
- Add `admin-delete-user` Supabase Edge Function with FK cleanup pre-steps and "Eliminar usuario" UI in admin users panel

**Non-Goals:**
- Removing `no_show` from the DB `status` CHECK constraint (historical rows preserved, constraint unchanged)
- Customer opt-out of closure notifications
- Reminder emails or scheduled notifications for closures
- Soft-delete or archive mechanism for appointments (hard delete only)
- Batch user deletion
- Restoring deleted users or appointments

## Decisions

### D1 — Atomic deployment of 44a (no_show removal)
**Decision**: The `admin_get_dashboard_stats()` migration (DROP + CREATE), the `AdminDashboardStats` TypeScript interface update, and the frontend stat card/filter removal must land in the same deployment.

**Rationale**: PostgreSQL requires DROP + CREATE to change a RETURNS TABLE shape. If the migration runs before the frontend is updated, the old TypeScript interface will map `no_show_count` from a column that no longer exists — the RPC call will succeed but the field will be `undefined`, silently breaking the stat card that read it. Conversely, if the frontend is updated first, it will attempt to read `no_show_count` from a column that still exists, which is safe but wastes a round-trip. The safest atomic path is a single Vercel deployment that includes both the migration and the frontend changes.

**Alternative considered**: Feature flag the UI change independently — rejected because the schema change is the atomic unit; the flag only delays the problem.

### D2 — `get_upcoming_closures()` as a separate RPC (not extending `get_landing_config()`)
**Decision**: New `get_upcoming_closures()` SECURITY DEFINER RPC granted to `anon`; `get_landing_config()` is not modified.

**Rationale**: `get_landing_config()` returns a fixed single-row payload; closures are a variable-length dataset scoped to a 30-day window. Mixing them conflates two semantic concerns, inflates the landing payload on days with no closures, and complicates future changes to either contract. Separate RPCs allow independent caching, testing, and evolution.

### D3 — Danger zone double-confirmation (type "CONFIRMAR")
**Decision**: Two-step UX: first modal shows warning, second requires typing "CONFIRMAR" exactly before the destructive button is enabled.

**Rationale**: This is a hard irreversible operation. A single "Are you sure?" dialog is insufficient for deleting all appointment history. Requiring a typed confirmation significantly reduces accidental triggering and aligns with the pattern used by services like GitHub for destructive repo operations.

### D4 — `admin-delete-user` as a Supabase Edge Function
**Decision**: Hard user deletion is implemented as `supabase/functions/admin-delete-user/` using the service-role key.

**Rationale**: `supabase.auth.admin.deleteUser()` requires the service-role key, which must never be exposed to the browser. SECURITY DEFINER SQL functions cannot call auth admin APIs. The Edge Function is the correct execution boundary: it validates the caller's JWT, performs FK cleanup in a transaction, then calls the admin API. The frontend invokes it via `supabase.functions.invoke()`.

**FK cleanup order**: (1) Cancel `pending`/`confirmed` appointments for the user → frees staff slots; (2) NULL out `created_by_user_id` on all appointments (requires prior migration to drop NOT NULL constraint); (3) Set `is_active = false` on `staff_members` rows; (4) Call `deleteUser()` — cascades `profiles` + `user_roles` deletion and NULLs `customer_user_id`.

### D5 — `admin_get_stats_by_range` as a new RPC (not extending `admin_get_dashboard_stats`)
**Decision**: New separate `admin_get_stats_by_range(p_date_from timestamptz, p_date_to timestamptz)` RPC.

**Rationale**: `admin_get_dashboard_stats()` computes fixed time windows (today, this week, this month) using org timezone and is already used at page mount. Adding date parameters to it would change its call signature (requiring DROP + CREATE again) and conflate two distinct use cases. A new RPC with explicit date parameters is orthogonal, independently testable, and does not affect the existing dashboard stats call.

## Risks / Trade-offs

- **44a atomic deploy risk** → Mitigation: deploy the migration and frontend in the same Vercel deployment commit; verify locally that the RPC and TypeScript interface are consistent before merging
- **Edge Function authorization** → The Edge Function verifies the caller's JWT and checks `is_admin()` before proceeding; if JWT validation fails, returns 401; a compromised non-admin JWT cannot trigger deletion
- **`admin_delete_all_appointments()` irreversibility** → Mitigation: double-confirmation UX with typed confirmation; no soft-delete path available by design; document this clearly in the admin UI
- **`created_by_user_id NOT NULL` migration** → Dropping NOT NULL is non-breaking (existing rows remain valid); however, downstream code that assumed this column is always set must handle `null` gracefully → audit call sites before deploying
- **Closure banner always visible** → No dismiss button by spec; if an admin sets a closure by mistake, they must delete it from the admin panel to remove the banner — no self-healing mechanism in the UI

## Migration Plan

1. **44a** — Run migration: DROP `admin_get_dashboard_stats`, CREATE without `no_show_count`; deploy frontend atomically in the same Vercel deployment
2. **44b** — Run migration: CREATE `get_upcoming_closures()` RPC; deploy frontend changes; no breaking dependency
3. **44c** — Run migration: CREATE `admin_delete_all_appointments()` RPC; deploy frontend danger zone section; no breaking dependency
4. **44d** — Run migration: CREATE `admin_get_stats_by_range()` RPC; deploy frontend date-range analytics UI; no breaking dependency (new UI path)
5. **44e** — Run migration: ALTER `appointments.created_by_user_id` DROP NOT NULL; deploy Edge Function; deploy frontend "Eliminar usuario" UI; items 1–4 must be deployed first to avoid FK constraint violations at delete time

Rollback strategy: all RPCs can be DROPped and FE reverted; the `created_by_user_id` NOT NULL migration is non-reversible without a new migration (acceptable — nullability relaxation is safe).

## Open Questions

- None blocking. The 44a atomic deploy requirement is known and planned.
