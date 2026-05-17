## MODIFIED Requirements

### Requirement: Customer can view their appointments at /appointments
The system SHALL provide an `AppointmentsPage` at `/appointments`, accessible only to users with the `customer` role (enforced by RoleGuard). The page MUST display two tabs — **Próximos** (upcoming: `pending`/`confirmed` with `starts_at > now()`) and **Historial** (past + `cancelled`/`completed`/`no_show`) — and support a Lista ↔ Calendario view toggle. All user-facing copy MUST be in Spanish. Each appointment card in the **Próximos** tab MUST display a "Reprogramar" CTA for appointments with status `pending` or `confirmed` that navigates to `/appointments/:id/reschedule`. Each appointment card in the **Próximos** tab MUST display a "Cancelar" button for appointments with status `pending` or `confirmed` that opens an inline confirmation dialog.

#### Scenario: Page loads customer appointments on mount
- **WHEN** a customer navigates to `/appointments`
- **THEN** the page calls `list_appointments()` and shows a loading state while fetching

#### Scenario: Próximos tab shows upcoming confirmed/pending appointments
- **WHEN** the customer is on the Próximos tab
- **THEN** only appointments with `status IN ('pending', 'confirmed')` and `starts_at > now()` are shown

#### Scenario: Historial tab shows past and terminal-status appointments
- **WHEN** the customer switches to the Historial tab
- **THEN** appointments that are past or have status `cancelled`, `completed`, or `no_show` are shown

#### Scenario: Empty state shown per tab in Spanish
- **WHEN** the active tab has no appointments
- **THEN** a Spanish empty-state message is displayed (e.g., "No tenés turnos próximos" for Próximos tab)

#### Scenario: Error state shown in Spanish
- **WHEN** the `list_appointments()` call fails
- **THEN** a Spanish error message is displayed (e.g., "Ocurrió un error al cargar tus turnos.")

#### Scenario: Loading state shown in Spanish
- **WHEN** appointments are being fetched
- **THEN** a Spanish loading indicator is shown (e.g., "Cargando tus turnos...")

#### Scenario: Appointment card displays required fields
- **WHEN** an appointment is rendered in list mode
- **THEN** the card shows service name, date/time formatted in org timezone, staff display name, status badge, and booking reference (last 8 chars of UUID)

#### Scenario: Appointment card links to confirmation page
- **WHEN** a customer clicks an appointment card
- **THEN** navigation goes to `/booking/confirmation/:id`

#### Scenario: Reprogramar CTA appears on pending/confirmed cards in Próximos
- **WHEN** an upcoming appointment with status `pending` or `confirmed` is rendered in the Próximos tab
- **THEN** a "Reprogramar" CTA is visible on the card linking to `/appointments/:id/reschedule`

#### Scenario: Cancelar button appears on pending/confirmed cards in Próximos
- **WHEN** an upcoming appointment with status `pending` or `confirmed` is rendered in the Próximos tab
- **THEN** a "Cancelar" button is visible on the card that opens an inline confirmation dialog

#### Scenario: Non-customer is denied access
- **WHEN** a user with role other than `customer` accesses `/appointments`
- **THEN** they are redirected to `/unauthorized`

---

### Requirement: Staff can view their assigned appointments at /staff/appointments
The system SHALL provide a `StaffAppointmentsPage` at `/staff/appointments`, accessible only to users with the `staff` role (enforced by RoleGuard). The page MUST have the same tab and calendar structure as `AppointmentsPage` with the distinction that appointment cards show the customer name instead of staff name. Each appointment card in the **Próximos** tab MUST display a "Reprogramar" CTA for appointments with status `pending` or `confirmed` that navigates to `/appointments/:id/reschedule`. Each appointment card in the **Próximos** tab MUST display a "Cancelar" button for appointments with status `pending` or `confirmed` that opens an inline confirmation dialog. All user-facing copy MUST be in Spanish.

#### Scenario: Page loads staff-assigned appointments on mount
- **WHEN** a staff member navigates to `/staff/appointments`
- **THEN** the page calls `list_appointments()` and renders only appointments assigned to that staff member

#### Scenario: Staff card shows customer name
- **WHEN** an appointment card is rendered on the staff page
- **THEN** the customer name (from `profiles.full_name`) is shown instead of staff display name

#### Scenario: Reprogramar CTA appears on pending/confirmed cards in Próximos for staff
- **WHEN** an upcoming appointment with status `pending` or `confirmed` is rendered in the staff Próximos tab
- **THEN** a "Reprogramar" CTA is visible on the card linking to `/appointments/:id/reschedule`

#### Scenario: Cancelar button appears on pending/confirmed cards in Próximos for staff
- **WHEN** an upcoming appointment with status `pending` or `confirmed` is rendered in the staff Próximos tab
- **THEN** a "Cancelar" button is visible on the card that opens an inline confirmation dialog

#### Scenario: Empty state per tab shown in Spanish
- **WHEN** a tab has no appointments for the staff member
- **THEN** a Spanish empty-state message is displayed

#### Scenario: Non-staff is denied access
- **WHEN** a user without the `staff` role accesses `/staff/appointments`
- **THEN** they are redirected to `/unauthorized`
