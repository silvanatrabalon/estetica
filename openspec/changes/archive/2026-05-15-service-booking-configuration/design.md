## Context

The slot generator (#16) and booking flow (#17) depend on three booking constraints being readable from the database: which specific dates a service is available, how many concurrent bookings a service allows, and what global advance-notice/horizon window the business enforces. None of these exist today. This design covers the data model, access patterns, admin UI surface, and migration strategy for all three constraints before #16 is implemented.

The project follows an established pattern:
- Two migrations per concern: `_tables_grants_rls` (DDL + RLS) and `_admin_rpcs` (SECURITY DEFINER functions + EXECUTE grants)
- Admin RPC pattern: `if not public.is_admin() then raise exception 'No autorizado';` (plpgsql) or `where public.is_admin()` (sql language)
- Service layer in `src/services/*.ts` with typed camelCase interfaces, `snake_case` DB rows, and `toX()` mapper functions
- Pages in `src/pages/` connected via `src/lib/routing.ts` and `src/App.tsx`

## Goals / Non-Goals

**Goals:**
- Introduce `service_available_dates` table with admin CRUD RPCs and a management sub-page
- Add `services.max_concurrent_bookings` nullable integer column and expose it in the admin service form
- Add `organizations.booking_min_notice_minutes` and `organizations.booking_max_horizon_days` columns and expose them in Business Settings
- All three constraints readable via standard RLS SELECT by any authenticated user (for #16)
- All mutations admin-only via SECURITY DEFINER RPCs

**Non-Goals:**
- Per-service recurring weekly availability (staff schedule system already covers this via staff_schedules + staff_services join)
- Per-service booking policy overrides (MVP is global only)
- Customer-facing display of date constraints
- Capacity waitlist or overbooking flows
- Buffer time between bookings (→ #30)
- Slot generation or booking enforcement (→ #16/#17)

## Decisions

### D1: Two migrations total (not six)
**Decision**: One `_tables_grants_rls` migration covers all DDL changes (new table + two ALTER TABLEs + grants + RLS). One `_admin_rpcs` migration covers all new RPC functions.

**Rationale**: All three sub-concerns share a deploy boundary — they must all land before #16 starts. Splitting into six migrations adds noise with no benefit. The two-migration pattern is already established in the project.

**Alternative**: One migration per sub-concern (6 total). Rejected because it increases migration file count without adding rollback granularity (migrations are applied atomically anyway).

### D2: `service_available_dates` uses composite PK `(service_id, available_date)`
**Decision**: No surrogate `id` column. The natural composite key is sufficient and enforces uniqueness at the DB level without an extra unique constraint.

**Rationale**: Mirrors the `staff_services` junction pattern. The admin UI operates on `(service_id, date)` pairs directly.

### D3: Past dates in `service_available_dates` are kept (not auto-removed)
**Decision**: The admin UI shows all dates (past and future) ordered by date descending. No automatic pruning.

**Rationale**: Keeps the implementation simple. Past dates have no effect on slot generation (#16 will query `available_date >= today`). The admin can manually remove past dates if desired.

### D4: `max_concurrent_bookings` is nullable (null = no limit)
**Decision**: `null` means "unlimited"; any value ≥1 enforces the limit.

**Rationale**: Most services start without a capacity limit. Defaulting to null avoids a breaking change to existing services (no migration from some prior value). A CHECK constraint enforces `null OR >= 1`.

### D5: Booking policy columns go on `organizations`, not a separate `booking_policy` table
**Decision**: Add `booking_min_notice_minutes` and `booking_max_horizon_days` directly to `organizations`.

**Rationale**: Single-tenant product; there is exactly one organization record. A separate table adds a join with no benefit. `ALTER TABLE organizations ADD COLUMN` is non-destructive and backward-compatible. Defaults (60/60) are applied immediately after migration.

### D6: New service layer file `adminServiceAvailability.ts` (not merged into `adminServices.ts`)
**Decision**: Create a separate `src/services/adminServiceAvailability.ts` for the three date-management RPCs.

**Rationale**: Keeps individual service files focused on one concern. `adminServices.ts` grows with `maxConcurrentBookings` field only. Mirrors the `adminStaffServices.ts` / `adminStaff.ts` separation pattern.

### D7: Admin availability page is a sub-route (not an inline panel)
**Decision**: `/admin/services/:serviceId/availability` as a dedicated route, consistent with `/admin/staff/:staffId/availability` and `/admin/staff/:staffId/services`.

**Rationale**: The date list can grow long and a date picker needs vertical space. An inline panel would clutter the service list. The sub-route pattern is already established and understood.

## Risks / Trade-offs

- **Risk: `organizations` schema coupling** — adding columns directly to `organizations` means any future multi-tenant change must migrate these columns to an org-scoped settings table. → Mitigation: acceptable for single-tenant MVP; document as single-tenant assumption.
- **Risk: Stale capacity validation** — `max_concurrent_bookings` is checked by #16/#17 at query time, not enforced by a DB trigger. Race conditions are possible under concurrent booking. → Mitigation: #18 (Prevent Double Booking) will add concurrency-safe locking; this item only provides the configuration surface.
- **Risk: Past dates accumulate** — if admins never clean up old dates in `service_available_dates`, the table grows indefinitely. → Mitigation: negligible at MVP scale; a cleanup job can be added post-MVP.

## Migration Plan

1. Create migration `YYYYMMDDHHMMSS_service_booking_config_tables_grants_rls.sql`:
   - `CREATE TABLE service_available_dates` with composite PK, FK CASCADE on services, FK on organizations, RLS SELECT for authenticated
   - `ALTER TABLE services ADD COLUMN max_concurrent_bookings`
   - `ALTER TABLE organizations ADD COLUMN booking_min_notice_minutes, ADD COLUMN booking_max_horizon_days`
   - `GRANT SELECT ON service_available_dates TO authenticated`
   - RLS policies
2. Create migration `YYYYMMDDHHMMSS_service_booking_config_admin_rpcs.sql`:
   - `admin_list_service_available_dates`, `admin_add_service_available_date`, `admin_remove_service_available_date`
   - `admin_update_service_booking_policy` (updates the two columns on organizations)
   - All SECURITY DEFINER, EXECUTE granted to authenticated
3. Apply with `npx supabase db push`
4. Rollback: `ALTER TABLE services DROP COLUMN`, `ALTER TABLE organizations DROP COLUMN IF EXISTS`, `DROP TABLE service_available_dates`, `DROP FUNCTION` for each RPC — only safe before #16 uses the columns

## Open Questions

1. **At-capacity slot display in #16/17**: when `max_concurrent_bookings` is reached for a slot, should the slot be hidden entirely in the booking UI, or shown as "sin disponibilidad"? (Deferred to #16 spec — this item only stores the configuration value.)
2. **RPC for 15b/15c**: `admin_update_service` already exists — should capacity be updated via a new dedicated RPC or by extending `admin_update_service`? Decision: extend `admin_update_service` to accept `p_max_concurrent_bookings` (nullable) to avoid a proliferation of single-field RPCs.
