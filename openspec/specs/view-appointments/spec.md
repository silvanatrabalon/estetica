## ADDED Requirements

### Requirement: List appointments RPC returns role-aware data
The system SHALL provide a `list_appointments()` SECURITY DEFINER PostgreSQL function, granted to the `authenticated` role, that returns appointment rows joined with service, staff, organization, and profile data. The function MUST apply role-based filtering internally: customers see only their own appointments (`customer_user_id = auth.uid()`), staff see appointments where `staff_members.profile_user_id = auth.uid()`, and admins see all org appointments. Results MUST be ordered by `starts_at DESC` with a hard limit of 200 rows.

#### Scenario: Customer calls list_appointments
- **WHEN** an authenticated customer calls `list_appointments()`
- **THEN** only appointments where `customer_user_id = auth.uid()` are returned

#### Scenario: Staff calls list_appointments
- **WHEN** an authenticated staff member calls `list_appointments()`
- **THEN** only appointments assigned to that staff member (via `staff_members.profile_user_id = auth.uid()`) are returned

#### Scenario: Admin calls list_appointments
- **WHEN** an authenticated admin calls `list_appointments()`
- **THEN** all appointments in the organization are returned

#### Scenario: Non-owner customer cannot see other customers' appointments
- **WHEN** customer A calls `list_appointments()`
- **THEN** appointments belonging to customer B are NOT included in the result

#### Scenario: Unauthenticated caller is denied
- **WHEN** an unauthenticated caller invokes `list_appointments()`
- **THEN** a permission error is raised

#### Scenario: Result includes joined fields
- **WHEN** any authorized caller calls `list_appointments()`
- **THEN** each row includes `service_name`, `service_duration_minutes`, `service_price_cents`, `staff_display_name`, `org_name`, `org_timezone`, and `customer_name`

#### Scenario: Hard limit enforced
- **WHEN** a caller has more than 200 appointments
- **THEN** the function returns at most 200 rows ordered by `starts_at DESC`

---

### Requirement: Customer can view their appointments at /appointments
The system SHALL provide an `AppointmentsPage` at `/appointments`, accessible only to users with the `customer` role (enforced by RoleGuard). The page MUST display two tabs — **Próximos** (upcoming: `pending`/`confirmed` with `starts_at > now()`) and **Historial** (past + `cancelled`/`completed`/`no_show`) — and support a Lista ↔ Calendario view toggle. All user-facing copy MUST be in Spanish.

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

#### Scenario: Non-customer is denied access
- **WHEN** a user with role other than `customer` accesses `/appointments`
- **THEN** they are redirected to `/unauthorized`

---

### Requirement: Customer can toggle between list and calendar views
The system SHALL provide a view toggle on `AppointmentsPage` allowing the customer to switch between **Lista** (tabbed list) and **Calendario** (calendar) modes. In calendar mode, a secondary toggle allows switching between **Semanal** (weekly) and **Mensual** (monthly) calendar views. The calendar MUST be read-only.

#### Scenario: Default view is Lista
- **WHEN** the customer first loads `/appointments`
- **THEN** the Lista view is active

#### Scenario: User toggles to calendar view
- **WHEN** the user clicks the Calendario toggle
- **THEN** the calendar view replaces the list

#### Scenario: Weekly calendar shows correct days
- **WHEN** the weekly calendar is active
- **THEN** 7 day columns are shown for the current week, with appointment time blocks in the correct column

#### Scenario: Monthly calendar shows correct grid
- **WHEN** the monthly calendar is active
- **THEN** a month grid is shown with appointments as dots or event chips per day cell

#### Scenario: Calendar shows all appointments regardless of tab filter
- **WHEN** the calendar view is active
- **THEN** all appointments (upcoming and historical) are visible when navigating to their date

#### Scenario: Monthly calendar limits chips to 3 per day
- **WHEN** a day cell has more than 3 appointments
- **THEN** a maximum of 3 chips are shown with a "+N más" indicator for the remainder

#### Scenario: Calendar navigation moves to previous/next week or month
- **WHEN** the user clicks the previous or next navigation arrow
- **THEN** the calendar advances or retreats by one week (weekly) or one month (monthly)

---

### Requirement: Staff can view their assigned appointments at /staff/appointments
The system SHALL provide a `StaffAppointmentsPage` at `/staff/appointments`, accessible only to users with the `staff` role (enforced by RoleGuard). The page MUST have the same tab and calendar structure as `AppointmentsPage` with the distinction that appointment cards show the customer name instead of staff name. All user-facing copy MUST be in Spanish.

#### Scenario: Page loads staff-assigned appointments on mount
- **WHEN** a staff member navigates to `/staff/appointments`
- **THEN** the page calls `list_appointments()` and renders only appointments assigned to that staff member

#### Scenario: Staff card shows customer name
- **WHEN** an appointment card is rendered on the staff page
- **THEN** the customer name (from `profiles.full_name`) is shown instead of staff display name

#### Scenario: Empty state per tab shown in Spanish
- **WHEN** a tab has no appointments for the staff member
- **THEN** a Spanish empty-state message is displayed

#### Scenario: Non-staff is denied access
- **WHEN** a user without the `staff` role accesses `/staff/appointments`
- **THEN** they are redirected to `/unauthorized`

---

### Requirement: useAppointments hook manages fetch lifecycle
The system SHALL provide a `useAppointments` React hook that calls `listAppointments()` from the appointments service layer, managing `loading`, `error`, and `appointments` state. The hook MUST handle loading, success, empty, and error transitions.

#### Scenario: Hook returns loading true while fetching
- **WHEN** `useAppointments` is called and the fetch is in progress
- **THEN** `loading` is `true` and `appointments` is an empty array

#### Scenario: Hook returns appointments on success
- **WHEN** `listAppointments()` resolves successfully
- **THEN** `loading` is `false`, `error` is `null`, and `appointments` contains the returned data

#### Scenario: Hook returns empty array when no appointments exist
- **WHEN** `listAppointments()` resolves with an empty array
- **THEN** `loading` is `false`, `error` is `null`, and `appointments` is `[]`

#### Scenario: Hook returns error on failure
- **WHEN** `listAppointments()` rejects with an error
- **THEN** `loading` is `false`, `error` is set, and `appointments` is `[]`
