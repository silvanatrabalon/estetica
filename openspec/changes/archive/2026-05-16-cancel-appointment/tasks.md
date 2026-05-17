## 1. Database Migration

- [x] 1.1 Create migration file `supabase/migrations/<timestamp>_cancel_appointment_rpc.sql`
- [x] 1.2 Implement `cancel_appointment(p_appointment_id uuid)` SECURITY DEFINER function with role-based auth (customer own / staff assigned / admin any)
- [x] 1.3 Add status guard: only `pending` or `confirmed` may be cancelled; raise `CANCEL_INVALID_STATUS` otherwise
- [x] 1.4 Add policy window check for customer callers using `booking_min_notice_minutes`; raise `CANCEL_OUTSIDE_POLICY_WINDOW` if within window
- [x] 1.5 Add atomic UPDATE: `status = 'cancelled'`, `updated_at = now()`; include `-- TODO(#27): trigger cancellation notification` comment
- [x] 1.6 Add `GRANT EXECUTE ON FUNCTION cancel_appointment TO authenticated`
- [x] 1.7 Run `npx supabase db push` and verify the migration applies cleanly

## 2. SQL Smoke Tests

- [x] 2.1 Add customer-own-appointment cancellation test to `supabase/tests/role_rls_matrix.sql`
- [x] 2.2 Add customer-other-appointment rejection test (`CANCEL_NOT_AUTHORIZED`)
- [x] 2.3 Add staff-assigned cancellation test
- [x] 2.4 Add admin-any-appointment cancellation test
- [x] 2.5 Add already-cancelled rejection test (`CANCEL_INVALID_STATUS`)
- [x] 2.6 Add within-policy-window rejection test for customers (`CANCEL_OUTSIDE_POLICY_WINDOW`)

## 3. Service Layer

- [x] 3.1 Add `CancelAppointmentRow` interface to `src/services/appointments.ts` matching the RPC return shape (snake_case)
- [x] 3.2 Add `CancelledAppointment` interface (camelCase) to `src/services/appointments.ts`
- [x] 3.3 Add named error constants: `CANCEL_OUTSIDE_POLICY_WINDOW`, `CANCEL_INVALID_STATUS`, `CANCEL_NOT_AUTHORIZED`
- [x] 3.4 Implement `translateCancelError(err: unknown): string` that maps `P0001:<NAME>` codes to Spanish and falls back to the generic message
- [x] 3.5 Implement `cancelAppointment({ appointmentId }: { appointmentId: string }): Promise<CancelledAppointment>` that calls the RPC, maps the row, and throws with the translated message on error
- [x] 3.6 Export `cancelAppointment` and `CancelledAppointment` from `src/services/index.ts`

## 4. AppointmentCard Component

- [x] 4.1 Add `showCancelAction?: boolean` prop to `AppointmentCard` component interface
- [x] 4.2 Render "Cancelar" button in card footer only when `showCancelAction === true` and status is `pending` or `confirmed`
- [x] 4.3 Implement inline confirmation dialog with Spanish copy: "¿Cancelar este turno? Esta acción no se puede deshacer.", "Sí, cancelar", "Volver"
- [x] 4.4 Wire "Volver" to close dialog without calling the service
- [x] 4.5 Wire "Sí, cancelar" to call `cancelAppointment({ appointmentId })`; on success notify parent via `onCancelSuccess` callback prop
- [x] 4.6 Display inline Spanish error message in dialog when `cancelAppointment` throws; keep dialog open
- [x] 4.7 Add loading state to "Sí, cancelar" button while RPC is in flight (disable both buttons)

## 5. AppointmentsPage Integration

- [x] 5.1 Pass `showCancelAction={tab === 'proximos'}` to `AppointmentCard` in `AppointmentsPage`
- [x] 5.2 Implement `onCancelSuccess` handler: optimistically update the appointment in local state to `status: 'cancelled'`

## 6. StaffAppointmentsPage Integration

- [x] 6.1 Pass `showCancelAction={tab === 'proximos'}` to `AppointmentCard` in `StaffAppointmentsPage`
- [x] 6.2 Implement `onCancelSuccess` handler: optimistically update the appointment in local state to `status: 'cancelled'`

## 7. Tests

- [x] 7.1 Add unit tests for `translateCancelError` covering all four error codes and the generic fallback
- [x] 7.2 Add unit test for `cancelAppointment` success case (mocked RPC returns row → resolved `CancelledAppointment`)
- [x] 7.3 Add unit test for `cancelAppointment` RPC error case (mocked error → thrown with Spanish message)
- [x] 7.4 Add `AppointmentCard` test: "Cancelar" button not rendered when `showCancelAction=false`
- [x] 7.5 Add `AppointmentCard` test: "Cancelar" button not rendered for terminal statuses even with `showCancelAction=true`
- [x] 7.6 Add `AppointmentCard` test: dialog opens when "Cancelar" is clicked
- [x] 7.7 Add `AppointmentCard` test: "Volver" dismisses dialog without calling service
- [x] 7.8 Add `AppointmentCard` test: "Sí, cancelar" calls `cancelAppointment` and calls `onCancelSuccess` on success
- [x] 7.9 Add `AppointmentCard` test: error from `cancelAppointment` renders Spanish message inside dialog
- [x] 7.10 Run full test suite (`npm test`) and confirm 0 failures
