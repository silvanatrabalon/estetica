## ADDED Requirements

### Requirement: cancel_appointment RPC enforces role-based authorization
The system SHALL provide a `cancel_appointment(p_appointment_id uuid)` SECURITY DEFINER PostgreSQL function granted to the `authenticated` role. The function MUST enforce authorization by role: a customer caller MUST only be able to cancel appointments where `customer_user_id = auth.uid()`; a staff caller MUST only cancel appointments assigned to them via `staff_members.profile_user_id = auth.uid()`; an admin caller MAY cancel any organization appointment. Unauthorized callers MUST raise a named error `CANCEL_NOT_AUTHORIZED`.

#### Scenario: Customer cancels their own appointment
- **WHEN** an authenticated customer calls `cancel_appointment` with their own appointment ID
- **THEN** the appointment status is set to `cancelled` and the updated row is returned

#### Scenario: Customer cannot cancel another customer's appointment
- **WHEN** an authenticated customer calls `cancel_appointment` with a different customer's appointment ID
- **THEN** a `CANCEL_NOT_AUTHORIZED` error is raised

#### Scenario: Staff cancels an assigned appointment
- **WHEN** an authenticated staff member calls `cancel_appointment` with an appointment assigned to them
- **THEN** the appointment status is set to `cancelled` and the updated row is returned

#### Scenario: Admin cancels any appointment
- **WHEN** an authenticated admin calls `cancel_appointment` with any organization appointment ID
- **THEN** the appointment status is set to `cancelled` and the updated row is returned

#### Scenario: Unauthenticated caller is denied
- **WHEN** an unauthenticated caller invokes `cancel_appointment`
- **THEN** a permission error is raised

---

### Requirement: cancel_appointment RPC enforces status guard
The function MUST only allow cancelling appointments with status `pending` or `confirmed`. Attempting to cancel an appointment with status `cancelled`, `completed`, or `no_show` MUST raise a named error `CANCEL_INVALID_STATUS`.

#### Scenario: Confirmed appointment can be cancelled
- **WHEN** the target appointment has status `confirmed`
- **THEN** the cancellation proceeds

#### Scenario: Pending appointment can be cancelled
- **WHEN** the target appointment has status `pending`
- **THEN** the cancellation proceeds

#### Scenario: Already-cancelled appointment cannot be cancelled again
- **WHEN** the target appointment already has status `cancelled`
- **THEN** a `CANCEL_INVALID_STATUS` error is raised

#### Scenario: Completed appointment cannot be cancelled
- **WHEN** the target appointment has status `completed`
- **THEN** a `CANCEL_INVALID_STATUS` error is raised

#### Scenario: No-show appointment cannot be cancelled
- **WHEN** the target appointment has status `no_show`
- **THEN** a `CANCEL_INVALID_STATUS` error is raised

---

### Requirement: cancel_appointment RPC enforces booking policy window for customers
For customer callers, the function MUST validate that `appointment.starts_at >= now() + org.booking_min_notice_minutes`. If the appointment starts within the minimum notice window, the function MUST raise a named error `CANCEL_OUTSIDE_POLICY_WINDOW`. Staff and admin callers MUST bypass this check.

#### Scenario: Customer cancellation rejected within policy window
- **WHEN** a customer calls `cancel_appointment` and the appointment starts less than `booking_min_notice_minutes` from now
- **THEN** a `CANCEL_OUTSIDE_POLICY_WINDOW` error is raised

#### Scenario: Customer cancellation accepted outside policy window
- **WHEN** a customer calls `cancel_appointment` and the appointment starts at least `booking_min_notice_minutes` from now
- **THEN** the cancellation proceeds

#### Scenario: Staff bypasses policy window check
- **WHEN** a staff member calls `cancel_appointment` for an appointment starting within the customer policy window
- **THEN** the cancellation proceeds without a policy error

#### Scenario: Admin bypasses policy window check
- **WHEN** an admin calls `cancel_appointment` for an appointment starting within the customer policy window
- **THEN** the cancellation proceeds without a policy error

---

### Requirement: cancel_appointment RPC atomically updates status and includes notification placeholder
The function MUST atomically set `status = 'cancelled'` and `updated_at = now()` in a single UPDATE statement. The function MUST include a comment `-- TODO(#27): trigger cancellation notification` at the point where a notification would be sent after a successful cancellation.

#### Scenario: Successful cancellation sets status to cancelled
- **WHEN** `cancel_appointment` succeeds
- **THEN** the returned row has `status = 'cancelled'` and an updated `updated_at` timestamp

#### Scenario: RPC source includes TODO comment
- **WHEN** reviewing the `cancel_appointment` function source
- **THEN** the comment `-- TODO(#27): trigger cancellation notification` appears after the successful UPDATE statement

---

### Requirement: cancelAppointment service function translates RPC errors to Spanish
The system SHALL provide a `cancelAppointment(params: { appointmentId: string }): Promise<CancelledAppointment>` TypeScript function in `src/services/appointments.ts`. The function MUST translate RPC error codes to Spanish user-facing messages:
- `P0001:CANCEL_OUTSIDE_POLICY_WINDOW` → "No podés cancelar con tan poca anticipación. Podés cancelarlo con al menos X horas de anticipación."
- `P0001:CANCEL_INVALID_STATUS` → "Este turno no puede cancelarse porque ya fue cancelado o completado."
- `P0001:CANCEL_NOT_AUTHORIZED` → "No tenés permiso para cancelar este turno."
- Generic fallback → "Ocurrió un error al cancelar el turno. Intentá de nuevo."

#### Scenario: Policy window error translates to Spanish
- **WHEN** the RPC returns `P0001` with `CANCEL_OUTSIDE_POLICY_WINDOW`
- **THEN** `cancelAppointment` throws an Error with the correct Spanish policy message

#### Scenario: Invalid status error translates to Spanish
- **WHEN** the RPC returns `P0001` with `CANCEL_INVALID_STATUS`
- **THEN** `cancelAppointment` throws an Error with the correct Spanish status message

#### Scenario: Unauthorized error translates to Spanish
- **WHEN** the RPC returns `P0001` with `CANCEL_NOT_AUTHORIZED`
- **THEN** `cancelAppointment` throws an Error with the correct Spanish authorization message

#### Scenario: Generic error fallback in Spanish
- **WHEN** the RPC returns an unexpected error
- **THEN** `cancelAppointment` throws an Error with the generic Spanish fallback message

#### Scenario: Successful cancellation returns CancelledAppointment
- **WHEN** the RPC returns the updated appointment row
- **THEN** `cancelAppointment` returns a `CancelledAppointment` object with camelCase fields

---

### Requirement: AppointmentCard renders inline confirmation dialog for cancellation
The `AppointmentCard` component SHALL render a "Cancelar" button in the card footer when the `showCancelAction` prop is `true` and the appointment status is `pending` or `confirmed`. Clicking "Cancelar" MUST open an inline confirmation dialog with the copy "¿Cancelar este turno? Esta acción no se puede deshacer." and two actions: "Sí, cancelar" (destructive primary) and "Volver" (secondary). The dialog MUST be dismissed on "Volver" without any action.

#### Scenario: Cancelar button visible for pending/confirmed with showCancelAction=true
- **WHEN** `showCancelAction` is `true` and the appointment status is `pending` or `confirmed`
- **THEN** a "Cancelar" button is visible in the card footer

#### Scenario: Cancelar button hidden when showCancelAction=false
- **WHEN** `showCancelAction` is `false`
- **THEN** no "Cancelar" button is rendered regardless of status

#### Scenario: Cancelar button hidden for terminal statuses
- **WHEN** `showCancelAction` is `true` and the appointment status is `cancelled`, `completed`, or `no_show`
- **THEN** no "Cancelar" button is rendered

#### Scenario: Confirmation dialog opens on Cancelar click
- **WHEN** the user clicks the "Cancelar" button
- **THEN** a dialog appears with the text "¿Cancelar este turno? Esta acción no se puede deshacer."

#### Scenario: Volver dismisses dialog without action
- **WHEN** the user clicks "Volver" in the dialog
- **THEN** the dialog is closed and no RPC is called

#### Scenario: Sí cancelar calls cancelAppointment and optimistically updates
- **WHEN** the user clicks "Sí, cancelar" in the dialog
- **THEN** `cancelAppointment` is called and on success the appointment status badge updates to "Cancelado"

#### Scenario: Cancellation error shown in dialog in Spanish
- **WHEN** `cancelAppointment` throws an error
- **THEN** the dialog shows the Spanish error message and the appointment status badge is not updated
