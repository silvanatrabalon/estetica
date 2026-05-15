## ADDED Requirements

### Requirement: Fetch appointment details by ID
The system SHALL provide a `get_appointment(p_appointment_id uuid)` SECURITY DEFINER PostgreSQL function, granted to the `authenticated` role, that returns a single joined row with appointment, service, staff, and organization data.

#### Scenario: Owner retrieves their appointment
- **WHEN** an authenticated customer calls `get_appointment` with their own appointment ID
- **THEN** the function returns one row containing `id`, `starts_at`, `ends_at`, `status`, `created_at`, `customer_user_id`, `service_name`, `service_duration_minutes`, `service_price_cents`, `staff_display_name`, `org_name`, `org_timezone`

#### Scenario: Non-owner retrieves a different customer's appointment
- **WHEN** an authenticated customer calls `get_appointment` with an appointment ID that belongs to a different customer
- **THEN** the function returns zero rows (no error is raised)

#### Scenario: Staff or admin retrieves any appointment
- **WHEN** an authenticated staff or admin user calls `get_appointment` with any valid appointment ID in the organization
- **THEN** the function returns one row with the full joined data

#### Scenario: Appointment does not exist
- **WHEN** any authenticated caller calls `get_appointment` with a UUID that does not correspond to any appointment
- **THEN** the function returns zero rows (no error is raised)

#### Scenario: Unauthenticated caller
- **WHEN** an unauthenticated request attempts to call `get_appointment`
- **THEN** the function call is denied (permission error)

---

### Requirement: Booking confirmation page displays appointment details
The system SHALL render a confirmation page at `/booking/confirmation/:appointmentId` that loads appointment data on mount from the route param and displays it to the customer.

#### Scenario: Success state renders all appointment details
- **WHEN** the page loads and `get_appointment` returns a row
- **THEN** the page displays the service name, date formatted in org timezone, time formatted in org timezone, duration in minutes, staff display name, business name, a "Confirmado" status badge, and a booking reference equal to the last 8 characters of the appointment UUID

#### Scenario: Loading state
- **WHEN** the page mounts and the RPC call is in flight
- **THEN** the page displays a spinner with the text "Cargando tu turno..."

#### Scenario: Not-found or unauthorized state
- **WHEN** the RPC returns zero rows (appointment not found or caller is not authorized)
- **THEN** the page displays "No encontramos tu turno. Verificá que el enlace sea correcto."

#### Scenario: Error state
- **WHEN** the RPC call throws an error
- **THEN** the page displays "Ocurrió un error al cargar tu turno. Intentá de nuevo."

#### Scenario: Page is refreshable
- **WHEN** the customer navigates directly to `/booking/confirmation/:appointmentId` or refreshes the page
- **THEN** the page fetches the appointment using the ID from the URL param (not from navigation state) and renders the correct state

#### Scenario: "Ver mis turnos" CTA navigation
- **WHEN** the customer clicks "Ver mis turnos"
- **THEN** the app navigates to `/appointments`

#### Scenario: "Hacer otra reserva" CTA navigation
- **WHEN** the customer clicks "Hacer otra reserva"
- **THEN** the app navigates to `/booking`
