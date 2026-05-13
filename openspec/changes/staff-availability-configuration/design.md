## Context

The salon booking app needs per-staff availability data before the booking flow (feature #16) can generate accurate time slots. Currently, only business-wide hours (`business_hours`, `business_closure_exceptions`) exist. Staff members (#11) are in place but have no schedule attached.

The weekly template model is deliberately simple: a staff member has a recurring pattern that is configured once by the admin and applies indefinitely. One-off exception dates (day off, custom hours) override the pattern for specific dates. The slot generator will use both tables to determine valid time windows per staff per date.

## Goals / Non-Goals

**Goals:**
- Provide a stable, query-efficient data model for per-staff recurring availability
- Support one-off exception overrides (day off or custom hours for a specific date)
- Admin-only configuration UI accessible from the staff directory
- All mutations secured through SECURITY DEFINER RPCs (no direct DML from frontend)
- Authenticated read access for both tables (booking flow will need this)
- Spanish UI copy throughout

**Non-Goals:**
- Staff self-service schedule editing (admin-only in this MVP)
- Service-to-staff assignment (→ #14)
- Slot generation or booking availability calculation (→ #16)
- Break or buffer times within a working day (→ #30)
- Multiple schedule variants or shift patterns per staff

## Decisions

### 1. Parallel tables mirroring `business_hours` / `business_closure_exceptions`

**Decision:** Create `staff_schedules` (weekly template) and `staff_schedule_exceptions` (one-off overrides) as standalone tables with the same structural pattern as the business hour tables.

**Rationale:** The slot generator needs to apply a two-layer merge: `(business_hours - closures) ∩ (staff_schedule - exceptions)`. Keeping the layer structure parallel makes the merge logic symmetrical and predictable. A shared polymorphic table (staff + business hours together) would complicate RLS, indexing, and query clarity.

**Alternative considered:** Adding optional `staff_member_id` to `business_hours` to unify the model. Rejected because it conflates two distinct concerns (business operating hours vs. individual staff working hours), forces nullable columns, and makes queries messier.

### 2. Bulk replace for weekly schedule via single RPC

**Decision:** `admin_set_staff_schedule` deletes all existing rows for the staff member and inserts the new 7-row set atomically in one transaction.

**Rationale:** The admin UI always shows a full 7-day grid. Sending the complete week as a unit eliminates partial-update edge cases (e.g., day removed but old row lingers). Transactional replace is safe and simple.

**Alternative considered:** Per-day upsert RPC. Rejected because it requires the frontend to track which days changed and coordinate multiple calls, adding complexity for no benefit.

### 3. `exception_type` enum: `day_off` | `custom_hours`

**Decision:** Use a text column with a CHECK constraint: `day_off` (fully unavailable, no times) or `custom_hours` (different start/end for that date, replaces the weekly pattern).

**Rationale:** Covers both "not working at all" and "working different hours" with a clean constraint that enforces time presence/absence. Mirrors `business_closure_exceptions` `closure_type` (`full_day` / `half_day`) for conceptual consistency.

### 4. Route as dedicated page, not modal

**Decision:** `/admin/staff/:staffId/availability` is a full page, not a modal on `AdminStaffPage`.

**Rationale:** The weekly schedule grid (7 rows × day toggle + time inputs) plus the exception date list is too much UI to fit comfortably in a modal. A dedicated page also makes the URL bookmarkable and allows the form to use full-width layout.

### 5. Write-only via SECURITY DEFINER RPCs, reads via RLS

**Decision:** No INSERT/UPDATE/DELETE policies on base tables. All mutations go through `SECURITY DEFINER` functions that check `is_admin()` internally. Authenticated SELECT via RLS policy.

**Rationale:** Consistent with the pattern established in #11 (staff management RPCs). Centralizes admin authorization in the database, prevents accidental direct-write exploits from the frontend, and makes the security boundary explicit and auditable.

### 6. Wall-clock `time` type, not `timestamptz`

**Decision:** Store `start_time`/`end_time` as PostgreSQL `time` (wall-clock), not `timestamptz`.

**Rationale:** Recurring weekly patterns are inherently timezone-relative (e.g., "9 AM every Monday in the salon's timezone"). Storing as `timestamptz` would require a reference date. The slot generator resolves the actual UTC timestamps at query time using `organizations.timezone`.

## Risks / Trade-offs

- **Timezone conversion complexity** → The slot generator (#16) must load `organizations.timezone` and convert wall-clock times to UTC before slot comparison. This is a known dependency, documented in the integration contract. Risk is low as long as #16 explicitly reads the org timezone.
- **No validation that staff schedule is within business hours** → A staff member could be scheduled on a day the business is closed. The slot generator handles this via intersection; no DB-level cross-table constraint is needed. Risk: admin sets a schedule that silently produces zero slots. Mitigation: future UX improvement (out of scope here).
- **Exception date uniqueness per staff** → The `UNIQUE (staff_member_id, exception_date)` constraint means only one exception per date per staff. This is intentional and correct; `custom_hours` handles the "different hours" case without needing multiple rows.

## Migration Plan

1. `YYYYMMDD_staff_availability_tables.sql`: Create `staff_schedules` and `staff_schedule_exceptions` with indexes, grants, and RLS policies. Safe to apply at any time — additive only.
2. `YYYYMMDD_staff_availability_rpc.sql`: Create/replace SECURITY DEFINER RPC functions. Safe to apply independently; no data migration needed.
3. Rollback: Drop the two tables (cascades clean because no other table references them) and drop the RPC functions.

## Open Questions

- None blocking implementation. The slot generator timezone contract is a known future dependency, not a blocker for this feature.
