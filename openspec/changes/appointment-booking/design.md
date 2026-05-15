## Context

The booking wizard (`BookingPage.tsx`) currently stops at Step 3: the customer can select a time slot but cannot confirm it. The appointment data model (`appointments` table) exists in the foundation schema but has no RLS policies, no booking-safe constraint, and no server-side write path.

The existing `ux_appointments_staff_exact_slot` unique index was created as a placeholder. It prevents two bookings from sharing the exact same `starts_at` timestamp for a staff member, but it cannot enforce overlap prevention for services of different durations — a booking from 10:00–10:30 and another from 10:15–10:45 would not be blocked. The exclusion constraint approach is needed for correctness.

All write paths touching `appointments` must go through SECURITY DEFINER RPCs to enforce business rules (booking window, capacity, staff availability) atomically.

## Goals / Non-Goals

**Goals:**
- Secure `appointments` with RLS policies for customer, staff, and admin reads
- Replace the placeholder unique index with a correct GIST exclusion constraint that enforces half-open interval overlap semantics
- Implement `create_appointment` RPC that auto-assigns staff, enforces capacity, validates booking window, and returns the new appointment atomically
- Provide a typed TypeScript service function with Spanish error translations for all known failure modes
- Extend `BookingPage` with a Step 4 review/confirm screen and success routing

**Non-Goals:**
- Confirmation page UI (`/booking/confirmation/:appointmentId`) — stubbed in routing only (#19)
- Email notifications on booking (#27)
- Admin or staff views of appointments (#20, #23)
- Cancellation or rescheduling (#22, #21)
- Manual staff selection by the customer

## Decisions

### 1. GIST exclusion constraint over unique index
**Decision:** Replace `ux_appointments_staff_exact_slot` with `excl_appointments_staff_no_overlap` using `tstzrange(starts_at, ends_at, '[)')` and the `&&` (overlap) operator.

**Rationale:** The existing unique index only blocks exact `starts_at` matches per staff member. For services with non-zero duration, a booking at 10:00–10:30 does not block 10:15–10:45. `btree_gist` enables range overlap exclusion in a single constraint with the same partial filter (`status IN ('pending', 'confirmed')`). Half-open `[)` interval means `ends_at` of one slot equals `starts_at` of the next — back-to-back bookings are allowed.

**Alternatives considered:**
- Application-level overlap check before INSERT: rejected — race conditions; two concurrent requests could both pass the check and both insert.
- Trigger on INSERT/UPDATE: rejected — more complexity than an exclusion constraint for the same guarantee.

### 2. SECURITY DEFINER RPC for all writes
**Decision:** `create_appointment` is a `SECURITY DEFINER` function owned by `postgres`, granted to `authenticated`. No direct INSERT on `appointments` is granted.

**Rationale:** Business rules (booking window, capacity, staff assignment) must be enforced atomically at the DB layer. SECURITY DEFINER avoids granting broad INSERT rights to `authenticated` while keeping all logic in one transaction. This matches the pattern established by `get_available_slots` and `admin_create_service`.

**Alternatives considered:**
- Direct INSERT from frontend with application-level validation: rejected — not atomic, bypasses capacity and window enforcement.

### 3. Auto-assign staff by `created_at ASC`
**Decision:** The RPC picks the first active staff member assigned to the service with no overlapping confirmed/pending appointment, ordered by `staff_members.created_at ASC`.

**Rationale:** Deterministic and simple for MVP. Avoids exposing staff-selection UI to customers. Consistent with the slot generation logic in `get_available_slots`, which already computes slots per-staff.

**Alternatives considered:**
- Round-robin by booking count: more equitable distribution, but adds complexity and a counter that must be maintained.
- Random assignment: non-deterministic; harder to test.

### 4. `status = 'confirmed'` on insert (auto-confirm)
**Decision:** New bookings are inserted with `status = 'confirmed'`, skipping `pending`.

**Rationale:** No manual approval step exists in the current product scope. Using `confirmed` directly eliminates a state transition that has no trigger yet.

### 5. Error handling at the service layer (Spanish copy)
**Decision:** `src/services/appointments.ts` translates known Postgres error codes and `P0001` raise messages into user-facing Spanish strings before they reach the UI.

**Rationale:** Keeps Spanish copy colocated with the service call. The UI only needs to catch the already-translated message and render it — no UI-layer error mapping needed.

## Risks / Trade-offs

- **[Risk] Drop + re-add constraint requires table lock** → Mitigation: migration runs outside production peak hours; `appointments` table is empty at this stage.
- **[Risk] `btree_gist` extension install** → Mitigation: `CREATE EXTENSION IF NOT EXISTS btree_gist` is idempotent and safe to re-run.
- **[Risk] Staff auto-assignment is non-equitable** → Accepted for MVP; load balancing is a #22+ concern.
- **[Risk] `BOOKING_OUTSIDE_POLICY_WINDOW` requires `booking_min_notice_minutes` and `booking_max_horizon_days` on `organizations`** → These columns were added in #15c migration; the RPC reads them directly from the org row.

## Migration Plan

1. `CREATE EXTENSION IF NOT EXISTS btree_gist`
2. Enable `appointments` RLS with `GRANT SELECT` to `authenticated`
3. `DROP INDEX ux_appointments_staff_exact_slot`
4. `ADD CONSTRAINT excl_appointments_staff_no_overlap` (GIST)
5. `CREATE OR REPLACE FUNCTION create_appointment(...)` with `SECURITY DEFINER`
6. `GRANT EXECUTE ON FUNCTION create_appointment TO authenticated`

**Rollback:** Drop the exclusion constraint, drop the function, re-create the unique index, revoke grants.

No data migration needed — `appointments` is empty at deployment time.

## Open Questions

- None. All design decisions are settled based on BACKLOG spec and existing codebase patterns.
