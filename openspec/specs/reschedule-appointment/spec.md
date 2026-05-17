### Requirement: reschedule_appointment RPC enforces role-based authorization
The system SHALL provide a `reschedule_appointment(p_appointment_id uuid, p_new_starts_at timestamptz)` SECURITY DEFINER PostgreSQL function granted to the `authenticated` role. The function MUST enforce authorization by role: a customer caller MUST only be able to reschedule appointments where `customer_user_id = auth.uid()`; a staff caller MUST only reschedule appointments assigned to them via `staff_members.profile_user_id = auth.uid()`; an admin caller MAY reschedule any organization appointment. Unauthorized callers MUST raise a named error `RESCHEDULE_NOT_AUTHORIZED`.

#### Scenario: Customer reschedules their own appointment
- **WHEN** an authenticated customer calls `reschedule_appointment` with their own appointment ID and a valid future slot
- **THEN** the appointment is updated and the updated row is returned

#### Scenario: Customer cannot reschedule another customer's appointment
- **WHEN** an authenticated customer calls `reschedule_appointment` with a different customer's appointment ID
- **THEN** a `RESCHEDULE_NOT_AUTHORIZED` error is raised

#### Scenario: Staff reschedules an assigned appointment
- **WHEN** an authenticated staff member calls `reschedule_appointment` with an appointment assigned to them
- **THEN** the appointment is updated and the updated row is returned

#### Scenario: Admin reschedules any appointment
- **WHEN** an authenticated admin calls `reschedule_appointment` with any organization appointment ID
- **THEN** the appointment is updated and the updated row is returned

#### Scenario: Unauthenticated caller is denied
- **WHEN** an unauthenticated caller invokes `reschedule_appointment`
- **THEN** a permission error is raised

---

### Requirement: reschedule_appointment RPC enforces status guard
The function MUST only allow rescheduling appointments with status `pending` or `confirmed`. Attempting to reschedule an appointment with status `cancelled`, `completed`, or `no_show` MUST raise a named error `RESCHEDULE_INVALID_STATUS`.

#### Scenario: Confirmed appointment can be rescheduled
- **WHEN** the target appointment has status `confirmed`
- **THEN** the reschedule proceeds

#### Scenario: Pending appointment can be rescheduled
- **WHEN** the target appointment has status `pending`
- **THEN** the reschedule proceeds

#### Scenario: Cancelled appointment cannot be rescheduled
- **WHEN** the target appointment has status `cancelled`
- **THEN** a `RESCHEDULE_INVALID_STATUS` error is raised

#### Scenario: Completed appointment cannot be rescheduled
- **WHEN** the target appointment has status `completed`
- **THEN** a `RESCHEDULE_INVALID_STATUS` error is raised

---

### Requirement: reschedule_appointment RPC enforces booking policy window for customers
For customer callers, the function MUST validate that `p_new_starts_at >= now() + org.booking_min_notice_minutes`. If the requested slot is within the minimum notice window, the function MUST raise a named error `RESCHEDULE_OUTSIDE_POLICY_WINDOW`. Staff and admin callers MUST bypass this check.

#### Scenario: Customer reschedule rejected within policy window
- **WHEN** a customer calls `reschedule_appointment` with `p_new_starts_at` less than `now() + booking_min_notice_minutes` ahead
- **THEN** a `RESCHEDULE_OUTSIDE_POLICY_WINDOW` error is raised

#### Scenario: Customer reschedule accepted outside policy window
- **WHEN** a customer calls `reschedule_appointment` with `p_new_starts_at` at least `booking_min_notice_minutes` ahead
- **THEN** the reschedule proceeds

#### Scenario: Staff bypasses policy window check
- **WHEN** a staff member calls `reschedule_appointment` with a `p_new_starts_at` within the customer policy window
- **THEN** the reschedule proceeds without a policy error

#### Scenario: Admin bypasses policy window check
- **WHEN** an admin calls `reschedule_appointment` with a `p_new_starts_at` within the customer policy window
- **THEN** the reschedule proceeds without a policy error

---

### Requirement: reschedule_appointment RPC recomputes ends_at server-side
The function MUST compute `ends_at = p_new_starts_at + services.duration_minutes * interval '1 minute'` for the appointment's service. The client MUST NOT be able to influence `ends_at`. The function MUST atomically update `starts_at`, `ends_at`, and `updated_at` in a single transaction.

#### Scenario: ends_at equals new_starts_at plus service duration
- **WHEN** `reschedule_appointment` succeeds
- **THEN** the returned `ends_at` equals `p_new_starts_at + service.duration_minutes`

#### Scenario: Atomic update includes updated_at
- **WHEN** `reschedule_appointment` succeeds
- **THEN** `updated_at` is set to `now()` on the updated row

---

### Requirement: reschedule_appointment RPC uses exclusion constraint for conflict detection
The existing `excl_appointments_staff_no_overlap` GIST exclusion constraint MUST enforce no overlap for the same `staff_member_id` when the UPDATE is applied. If the new `[starts_at, ends_at)` overlaps an existing `pending` or `confirmed` appointment for the same staff, the UPDATE MUST be rejected with PostgreSQL error code `23P01`.

#### Scenario: Conflicting slot rejected by exclusion constraint
- **WHEN** `reschedule_appointment` is called with a `p_new_starts_at` that overlaps an existing confirmed appointment for the same staff member
- **THEN** the UPDATE is rejected with a `23P01` exclusion violation

#### Scenario: Back-to-back slots are allowed
- **WHEN** `reschedule_appointment` is called with a `p_new_starts_at` that starts exactly when another appointment ends (no overlap)
- **THEN** the UPDATE succeeds

#### Scenario: Rescheduling to the same slot succeeds
- **WHEN** `reschedule_appointment` is called with the same `starts_at` as the current appointment
- **THEN** the UPDATE succeeds (the appointment overlaps only with itself, which is excluded from the constraint check)

---

### Requirement: reschedule_appointment RPC includes a notification placeholder comment
The function MUST include a comment `-- TODO(#27): trigger reschedule notification` at the point in the RPC logic where a notification would be sent after a successful update, so the integration point is documented for the notifications item (#27).

#### Scenario: RPC source includes TODO comment
- **WHEN** reviewing the `reschedule_appointment` function source
- **THEN** the comment `-- TODO(#27): trigger reschedule notification` appears after the successful UPDATE statement

---

### Requirement: rescheduleAppointment service function translates RPC errors to Spanish
The system SHALL provide a `rescheduleAppointment(params: { appointmentId: string; newStartsAt: string }): Promise<RescheduledAppointment>` TypeScript function in `src/services/appointments.ts`. The function MUST translate RPC error codes to Spanish user-facing messages:
- `23P01` (exclusion violation) → "El horario seleccionado ya no está disponible. Por favor, seleccioná otro turno."
- `P0001:RESCHEDULE_OUTSIDE_POLICY_WINDOW` → "No podés reprogramar con tan poca anticipación. Elegí un horario con al menos [X] horas de anticipación."
- `P0001:RESCHEDULE_INVALID_STATUS` → "Este turno no se puede reprogramar."
- `P0001:RESCHEDULE_NOT_AUTHORIZED` → "No tenés permiso para reprogramar este turno."

#### Scenario: Exclusion conflict translates to Spanish
- **WHEN** the RPC returns a `23P01` error
- **THEN** `rescheduleAppointment` throws an Error with the correct Spanish conflict message

#### Scenario: Policy window error translates to Spanish
- **WHEN** the RPC returns `P0001` with `RESCHEDULE_OUTSIDE_POLICY_WINDOW`
- **THEN** `rescheduleAppointment` throws an Error with the correct Spanish policy message

#### Scenario: Invalid status error translates to Spanish
- **WHEN** the RPC returns `P0001` with `RESCHEDULE_INVALID_STATUS`
- **THEN** `rescheduleAppointment` throws an Error with the correct Spanish status message

#### Scenario: Unauthorized error translates to Spanish
- **WHEN** the RPC returns `P0001` with `RESCHEDULE_NOT_AUTHORIZED`
- **THEN** `rescheduleAppointment` throws an Error with the correct Spanish authorization message

#### Scenario: Successful reschedule returns RescheduledAppointment
- **WHEN** the RPC returns the updated appointment row
- **THEN** `rescheduleAppointment` returns a `RescheduledAppointment` object with camelCase fields

---

### Requirement: ReschedulePage loads existing appointment and pre-selects service in slot picker
The system SHALL provide a `ReschedulePage` at `/appointments/:id/reschedule` accessible to users with the `customer`, `staff`, or `admin` role (enforced by RoleGuard). On mount, the page MUST call `getAppointment(id)` to load the existing appointment. It MUST pre-select the same service in `BookingDatePicker` and `SlotGrid` components (reused from #16). All user-facing copy MUST be in Spanish.

#### Scenario: Page calls get_appointment on mount
- **WHEN** a user navigates to `/appointments/:id/reschedule`
- **THEN** the page calls `getAppointment(id)` and shows a Spanish loading state while fetching

#### Scenario: Slot picker pre-selects the existing service
- **WHEN** the appointment is loaded successfully
- **THEN** the slot picker renders with the same service pre-selected

#### Scenario: Not-found or unauthorized appointment shows Spanish error
- **WHEN** `getAppointment` returns null (appointment not found or unauthorized)
- **THEN** a Spanish error message is displayed (e.g., "No encontramos este turno.")

#### Scenario: Load error shows Spanish error
- **WHEN** `getAppointment` throws an error
- **THEN** a Spanish error message is displayed (e.g., "Ocurrió un error al cargar el turno.")

---

### Requirement: ReschedulePage calls reschedule_appointment on slot confirmation and handles errors
After the user selects a slot and confirms, the page MUST call `rescheduleAppointment`. On success, the page MUST navigate to `/booking/confirmation/:id`. On a conflict or policy window error, the page MUST display an inline Spanish error message with an "Elegir otro turno" CTA that returns the user to the slot picker step.

#### Scenario: Successful reschedule navigates to confirmation
- **WHEN** `rescheduleAppointment` resolves successfully
- **THEN** the page navigates to `/booking/confirmation/:id`

#### Scenario: Conflict error shows inline message and back CTA
- **WHEN** `rescheduleAppointment` throws a conflict error (exclusion violation)
- **THEN** an inline Spanish error message is shown and an "Elegir otro turno" CTA is available

#### Scenario: Policy window error shows inline message and back CTA
- **WHEN** `rescheduleAppointment` throws a policy window error
- **THEN** the inline Spanish policy message is shown and an "Elegir otro turno" CTA is available

#### Scenario: Non-customer is denied access via RoleGuard
- **WHEN** a user without `customer`, `staff`, or `admin` role accesses `/appointments/:id/reschedule`
- **THEN** they are redirected to `/unauthorized`
