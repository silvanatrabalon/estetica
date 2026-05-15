## Context

`/booking/confirmation/:appointmentId` is registered in `routing.ts` as `role-restricted` for `customer` and renders `BookingConfirmationPage.tsx` in `App.tsx`. The page is currently a stub (heading "Turno confirmado" only). The `appointments` table has SELECT RLS policies. The `create_appointment` RPC was implemented in #17. `formatSlotTime` exists in `src/services/availability.ts`. `src/services/appointments.ts` already has `createAppointment()` and can be extended.

## Goals / Non-Goals

**Goals:**
- Implement `get_appointment(p_appointment_id uuid)` SECURITY DEFINER RPC that returns a joined appointment row for the owning customer, or for staff/admin — empty result (no error) otherwise
- Implement `getAppointment()` in `src/services/appointments.ts` with `AppointmentDetail` interface
- Replace stub `BookingConfirmationPage.tsx` with full implementation: loading, success, not-found, and error states
- Page is refreshable — reads appointmentId from route param, never from navigation state

**Non-Goals:**
- Email confirmation (→ #27)
- Customer cancellation (→ #22)
- Staff/admin status management (→ #20, #23)
- Reschedule (→ #21)
- New routes, new tables, new auth flows

## Decisions

**1. RPC instead of direct JOIN from frontend**
`staff_members.display_name` is not directly accessible to the `customer` role via RLS SELECT — the table is admin/staff-scoped. Using a SECURITY DEFINER RPC lets the function run as the definer (privileged) and return only the whitelisted fields, without granting customers broad access to `staff_members` or `organizations`. Alternatives: grant SELECT on individual columns via RLS; rejected because it widens the attack surface unnecessarily for a simple read.

**2. Empty result on unauthorized / not-found (no error)**
The RPC returns 0 rows rather than raising an error when the caller is not the owner and not staff/admin. This prevents ID enumeration: a caller cannot distinguish "appointment doesn't exist" from "appointment exists but you can't see it". The frontend treats both as "not found".

**3. `get_appointment` column aliasing to avoid 42702**
The function uses `RETURNS TABLE(id uuid, ...)`. To avoid the known 42702 ambiguous column reference error (same pattern fixed in #17 migrations), all table references in the body use explicit aliases (e.g., `a.id`, `s.name`, `sm.display_name`, `o.name`, `o.timezone`).

**4. `AppointmentDetail` interface in `src/services/appointments.ts`**
Keeps all appointment-related service logic co-located. `getAppointment()` maps snake_case RPC columns to camelCase, returning `null` when the RPC returns 0 rows (not-found/unauthorized case). The page distinguishes between `null` (not-found) and a thrown error (network/RPC error).

**5. Page state machine**
Four states: `loading` → `success | not-found | error`. Loading is the initial state (spinner). On RPC success with data → success state. On RPC success with empty rows → not-found. On thrown error → error. No retry logic in MVP.

**6. Date/time formatting**
Uses `formatSlotTime` from `src/services/availability.ts` for time display and `Intl.DateTimeFormat` (no third-party library) for date display — both in `organizations.timezone` from the RPC response. Booking reference = `appointmentId.slice(-8)`.

## Risks / Trade-offs

- **Race between auth session and page load**: If the page is accessed directly (refreshed), the Supabase auth session may not be ready when the RPC is called, causing a 401. Mitigation: the `useUser` hook is used to wait for session readiness before triggering the fetch — same pattern as other authenticated pages.
- **42702 ambiguous column**: RETURNS TABLE declares `id` as an OUT parameter name. If any unqualified `id` reference appears in the WHERE clause, Postgres raises 42702. Mitigation: use explicit table aliases throughout the function body (pattern established in prior migrations).
- **`not-found` vs `error` UX**: An empty RPC result and a thrown RPC error display different Spanish messages. The distinction is intentional but the user may not care — acceptable for MVP.

## Migration Plan

1. Add migration `20260515400000_get_appointment_rpc.sql` with the `get_appointment` SECURITY DEFINER function
2. Run `npx supabase db push`
3. Implement TypeScript service and page
4. Run tests
5. Commit and update BACKLOG #19
