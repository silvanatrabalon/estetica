## Context

The appointment lifecycle currently supports: create (#17), view (#20), and show confirmation (#19). Reschedule is the next logical action — customers, staff, and admin can move an existing `pending`/`confirmed` appointment to a new time without cancelling and re-booking. The reschedule path must reuse the slot picker already built in #16 (`BookingDatePicker` + `SlotGrid`) and the `get_appointment` RPC from #19 for loading appointment detail on mount. The `excl_appointments_staff_no_overlap` exclusion constraint (deployed in #17/18) already provides atomic conflict detection on UPDATE — the new RPC simply performs an UPDATE and lets the constraint fire if there is an overlap.

All appointment write operations in this codebase go through SECURITY DEFINER RPCs (not direct client DML). This pattern is already established for `create_appointment` and must be followed here.

## Goals / Non-Goals

**Goals:**
- `reschedule_appointment` RPC: authorizes by role, guards status (`pending`/`confirmed` only), enforces `booking_min_notice_minutes` for customers (staff/admin bypass), recomputes `ends_at` server-side, and atomically UPDATEs the appointment
- `ReschedulePage` at `/appointments/:id/reschedule`: loads existing appointment, pre-selects the same service, reuses the slot picker, calls the RPC on confirmation
- "Reprogramar" CTA on `AppointmentCard` for `pending`/`confirmed` appointments
- `rescheduleAppointment()` service function with Spanish error translation
- Route registered for `customer`, `staff`, and `admin` roles

**Non-Goals:**
- Email/SMS notifications — deferred to #27 (comment placeholder added in RPC)
- Changing service or staff during reschedule — same service + same staff, only the time slot changes
- Admin `bypass_policy` flag
- Reschedule limit (max N reschedules per appointment)
- Optimistic UI update after reschedule — navigating to `/booking/confirmation/:id` already shows the updated state

## Decisions

### 1. RPC does an UPDATE, conflict detection via existing constraint

The `reschedule_appointment` RPC UPDATEs `starts_at`, `ends_at`, and `updated_at` in one statement. The `excl_appointments_staff_no_overlap` GIST exclusion constraint on `appointments` fires on UPDATE just as it does on INSERT — if the new `[starts_at, ends_at)` overlaps another `pending`/`confirmed` appointment for the same staff, the UPDATE is rejected with `23P01`. No additional locking or gap-detection logic is needed.

**Alternative considered:** Read available slots first then UPDATE. Rejected — introduces a TOCTOU race condition. Letting the constraint handle it is the same approach used in `create_appointment` and is correct.

### 2. `ends_at` always recomputed server-side

The RPC receives only `p_new_starts_at`. It looks up `services.duration_minutes` for the appointment's service and computes `ends_at = p_new_starts_at + duration_minutes * interval '1 minute'`. The client cannot pass `ends_at`.

**Alternative considered:** Trust client-passed `ends_at`. Rejected — security risk; service duration is authoritative in the DB.

### 3. Same service, same staff member — only slot changes

Reschedule in MVP reuses the same `staff_member_id` and `service_id`. The slot picker is called with `p_staff_member_id` implicitly (the `get_available_slots` RPC is any-staff, but the UI pre-selects the same date/service; the RPC assignment stays the same staff). The RPC does not change `staff_member_id`.

**Alternative considered:** Allow changing staff during reschedule. Deferred — adds authorization complexity and scope creep; the MVP scenario is "same appointment, different time."

### 4. Separate route, not modal

`/appointments/:id/reschedule` is a full page route, not a dialog. This allows direct linking, bookmarking, and clean browser back navigation to the appointment list. Consistent with the design of `/appointments/:id` (booking confirmation) as a full page.

### 5. Error taxonomy and Spanish copy

Three error classes from the RPC, translated in `src/services/appointments.ts`:
- `23P01` / `RESCHEDULE_CONFLICT` → conflict copy (reuse booking conflict copy)
- `P0001:RESCHEDULE_OUTSIDE_POLICY_WINDOW` → policy window copy with dynamic minutes value
- `P0001:RESCHEDULE_INVALID_STATUS` → "Este turno no se puede reprogramar."
- `P0001:RESCHEDULE_NOT_AUTHORIZED` → "No tenés permiso para reprogramar este turno."

The `isConflictError` helper in `appointments.ts` is extended to cover `RESCHEDULE_CONFLICT`.

### 6. RoleGuard allows customer, staff, admin

The `/appointments/:id/reschedule` route is accessible to all three roles. Customers access it from `/appointments`, staff from `/staff/appointments`, admins from their view (#23). Authorization at the DB level (RPC) ensures each role can only reschedule what they own/are assigned to/manage.

## Risks / Trade-offs

- **Staff assigned to the appointment is no longer active** → The RPC should still allow reschedule (staff already assigned; the reschedule doesn't change staff_member_id). The exclusion constraint checks overlap, not staff activity. No special handling needed.

- **`get_available_slots` returns any-staff slots, not staff-specific** → The slot picker shows slots where *any* staff is free for the service. After the customer picks a slot, the RPC keeps the *existing* staff. If that staff is now busy at the new slot, the UPDATE will be rejected by the exclusion constraint and the user gets the conflict error + "Elegir otro turno" CTA. Acceptable for MVP.

- **Route path collision** → `/appointments/:id/reschedule` is a sub-path of `/appointments`. The existing `getRoutePolicy` uses `startsWith` matching. Adding the reschedule policy before the base `/appointments` policy in `routePolicies` array ensures correct precedence. Must verify order.

## Migration Plan

1. Add migration `YYYYMMDD_reschedule_appointment_rpc.sql` with the `reschedule_appointment` function (no table changes)
2. Deploy via `npx supabase db push`
3. No rollback complexity — DROP FUNCTION is the rollback; no schema changes

## Open Questions

*(none — all decisions resolved per backlog item #21)*
