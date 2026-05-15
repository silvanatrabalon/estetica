## Context

The booking flow (#16) requires filtering eligible staff by service. Today there is no relationship between staff members and the services they offer — any active staff can be booked for any active service. This change introduces the `staff_services` junction table and the admin tooling to manage it.

Existing patterns this change follows:
- Staff availability sub-route: `/admin/staff/:staffId/availability` (from #12) — this change mirrors that pattern exactly for `/admin/staff/:staffId/services`
- Admin RPC pattern: SECURITY DEFINER functions with `is_admin()` guard (established in #9, #11, #12, #14)
- Service layer pattern: `src/services/*.ts` with typed interfaces, snake→camelCase mappers, and re-export via `src/services/index.ts`

## Goals / Non-Goals

**Goals:**
- Introduce `staff_services` junction table with proper FK constraints and cascade behavior
- Provide admin tooling to assign/unassign active services per staff member
- Surface the assignment panel via `/admin/staff/:staffId/services` sub-route
- Keep the service layer and component consistent with existing admin patterns
- Enable #16 to read `staff_services` for staff filtering

**Non-Goals:**
- Per-staff pricing overrides
- Batch assign/unassign
- Staff self-service assignment
- Booking flow integration test (deferred to #16)
- Customer-facing service–staff display

## Decisions

### 1. No `is_active` on the junction — assignment is binary
An active/inactive concept on the junction adds complexity without value at this stage. If a service is deactivated it can't be assigned to new staff (assignable services filter by `is_active = true`). If a service is hard-deleted, the `ON DELETE CASCADE` automatically removes it from all assignments. The junction row either exists (assigned) or it doesn't (unassigned) — no soft-delete.

**Alternatives considered:** `is_active boolean` flag — rejected because it would require a third state to consider in the booking flow filter and the admin UI, with no current use case.

### 2. Dedicated sub-route `/admin/staff/:staffId/services` (not inline panel)
An inline accordion in the staff list would require loading all services for all staff members at once and managing complex multi-row expand state. A dedicated sub-route keeps each panel isolated, mirrors the `/availability` pattern already in place, and loads data on demand.

**Alternatives considered:** Inline expandable panel in `AdminStaffPage` — rejected due to performance implications and inconsistency with the availability pattern.

### 3. `admin_list_assignable_services` filters by `is_active = true`
Only active services can be assigned. Inactive services should not appear in the selector — an admin would need to reactivate the service first. This prevents assigning services that customers won't see in the booking flow.

### 4. Hard DELETE for unassignment (no soft-delete)
Removing an assignment is a deliberate admin action. There is no audit value in keeping a "deactivated assignment" row at this MVP stage. Audit logging is deferred to #33.

### 5. Two migrations (tables/grants/RLS + RPCs)
Follows the established pattern from #12 (`staff-availability-configuration`) and #14 (`services-catalog-admin`). Keeps schema DDL separate from RPC logic for readability and incremental rollback.

## Risks / Trade-offs

- **Risk**: Staff with no service assignments will be invisible in the booking flow when #16 is implemented. 
  → Mitigation: Document this behavior; the booking flow (#16) should handle the empty-staff case gracefully with a clear user message.

- **Risk**: `admin_list_assignable_services` may return an empty list if all active services are already assigned.
  → Mitigation: UI shows an explicit empty state ("Todos los servicios activos ya están asignados") rather than a disabled or hidden selector.

- **Risk**: A service deactivated after assignment will no longer appear in `admin_list_assignable_services` but the existing junction row remains (assignment persists for already-assigned staff).
  → This is intentional: existing assignments are not retroactively removed when a service is deactivated; only the booking flow will skip unavailable services.

## Migration Plan

1. Apply migration `_tables_grants_rls`: creates `staff_services` table, indexes, RLS SELECT policy, grants
2. Apply migration `_admin_rpcs`: creates 4 SECURITY DEFINER functions
3. Deploy frontend: new page, service layer, route, and link in `AdminStaffPage`
4. No data migration required — table starts empty; admins populate it

**Rollback:** Drop the two migrations (drop RPCs then drop table). No frontend data at risk since the junction table is new.

## Open Questions

None — all architecture decisions were resolved prior to this spec (see BACKLOG.md #14b).
