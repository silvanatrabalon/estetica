## Context

Appointment cancellation is a core self-service action. The `appointments` table already has `status = 'cancelled'` in its CHECK constraint (`pending`, `confirmed`, `cancelled`, `completed`, `no_show`). The `appointments` table has UPDATE RLS in place (admin/staff via `is_staff_or_admin()`), but customer-facing writes must go through a SECURITY DEFINER RPC to enforce business rules atomically without granting broad UPDATE permissions to customers.

The `reschedule_appointment` RPC (implemented in #21) established the pattern: SECURITY DEFINER function with role-based authorization, status guard, policy window enforcement for customers, and atomic UPDATE. `cancel_appointment` follows the same pattern — simpler, since it has no slot conflict concern.

The frontend already has `AppointmentCard` (from #20) structured with a card body link and a footer "Reprogramar" link (from #21). This change adds a "Cancelar" button to the same footer area, opening an inline `<dialog>` confirmation — no new route.

## Goals / Non-Goals

**Goals:**
- Implement `cancel_appointment(p_appointment_id uuid)` SECURITY DEFINER RPC: auth checks, status guard, policy window for customers, atomic UPDATE to `cancelled`.
- Add "Cancelar" button + inline confirmation dialog to `AppointmentCard` for upcoming (`pending`/`confirmed`) appointments.
- Optimistically update status badge in the appointments list after successful cancellation.
- Translate all RPC errors to Spanish in the service layer.
- All user-facing copy in Spanish.

**Non-Goals:**
- Email/SMS notifications (→ #27).
- `cancellation_note` field (deferred to post-MVP).
- Admin force-cancel bypassing policy window.
- Separate `cancellation_min_notice_minutes` org setting (reuses `booking_min_notice_minutes`).

## Decisions

**D1: SECURITY DEFINER RPC for all writes**
Customers don't have `UPDATE` access on `appointments`. A SECURITY DEFINER function enforces the authorization and business rules atomically. Alternative (RLS-based direct UPDATE) was rejected: it would require customer UPDATE grants and can't enforce the policy window in one query.

**D2: Reuse `booking_min_notice_minutes` for cancellation policy**
No new column added to `organizations`. Rationale: same notice window for both booking and cancellation is a sensible MVP default. A separate `cancellation_min_notice_minutes` can be added in #30 (Booking Rules Configuration) if needed.

**D3: Inline confirmation dialog, not a new route**
Cancel is a single destructive action — a confirmation dialog is the right UX pattern. A separate route would add friction and complexity without benefit. Using the HTML `<dialog>` element (or a controlled modal component) keeps the UI self-contained in `AppointmentCard`.

**D4: Optimistic update in the parent list**
After `cancelAppointment()` resolves, update the appointment's status in local state (`appointments` array) rather than re-fetching the full list. This gives instant visual feedback. On error, the state is not modified (error message shown in dialog).

**D5: Error named constants mirror reschedule pattern**
Reuse the same error translation pattern from `translateRescheduleError`: named string constants, a `translateCancelError(err)` function that maps `P0001:<NAME>` to Spanish copy, with a generic fallback.

**D6: "Cancelar" CTA placement on AppointmentCard**
The card footer already has "Reprogramar" for `showRescheduleAction`. "Cancelar" is added alongside it (same footer `px-4 pb-3` area), visible when `showCancelAction` prop is `true` and status is `pending` or `confirmed`. This maintains the existing card structure.

## Risks / Trade-offs

- **Optimistic update drift**: if the network error occurs after the server already wrote the cancellation, the UI shows the pre-cancel state while the DB has `cancelled`. → Mitigation: on error, surface a Spanish error and prompt user to refresh; re-fetch on dialog close on error.
- **Double-cancel race**: two concurrent cancel requests for the same appointment. → Mitigation: status guard in RPC raises `CANCEL_INVALID_STATUS` if already `cancelled` — the second call fails gracefully.
- **Policy window UX**: displaying the exact `booking_min_notice_minutes` value in the error message requires reading it from `organizations`. → Mitigation: the error message uses the generic pattern "Podés cancelarlo con al menos X horas de anticipación" where X is derived from the org's `booking_min_notice_minutes` stored in business settings context (or hardcoded from the RPC error message if not surfaced).

## Migration Plan

1. Create migration `supabase/migrations/YYYYMMDD_cancel_appointment_rpc.sql`:
   - `CREATE OR REPLACE FUNCTION public.cancel_appointment(...)` SECURITY DEFINER
   - `GRANT EXECUTE` to `authenticated`
2. Run `npx supabase db push`.
3. Implement TypeScript service layer changes.
4. Implement frontend changes.
5. Run full test suite — all tests must pass before considering complete.
