## ADDED Requirements

### Requirement: Appointments table read access is restricted by role
The system SHALL enforce row-level security on `public.appointments` such that customers can only read their own appointments, and staff or admin users can read all appointments within the organization.

#### Scenario: Customer reads own appointment
- **WHEN** an authenticated customer queries `appointments`
- **THEN** only rows where `customer_user_id = auth.uid()` are returned

#### Scenario: Staff reads any appointment in the organization
- **WHEN** an authenticated staff or admin user queries `appointments`
- **THEN** all rows belonging to the singleton organization are returned

#### Scenario: Unauthenticated user cannot read appointments
- **WHEN** an anonymous request queries `appointments`
- **THEN** no rows are returned and no error is raised

### Requirement: Double-booking is prevented at the database level using overlap exclusion
The system SHALL prevent a staff member from being booked for two overlapping appointments using a GIST exclusion constraint on the half-open interval `[starts_at, ends_at)`. Only `pending` and `confirmed` appointments participate in the exclusion. `cancelled`, `completed`, and `no_show` statuses do not block new bookings.

#### Scenario: Overlapping booking for same staff is rejected
- **WHEN** an attempt is made to insert an appointment for a staff member whose `starts_at`–`ends_at` range overlaps an existing `pending` or `confirmed` appointment
- **THEN** the insert is rejected with a constraint violation (`23P01`)

#### Scenario: Back-to-back bookings for same staff are allowed
- **WHEN** a new appointment's `starts_at` equals the `ends_at` of an existing `confirmed` appointment for the same staff member
- **THEN** the insert succeeds (half-open `[)` interval semantics)

#### Scenario: Cancelled appointment does not block new booking
- **WHEN** an existing appointment for a staff member has `status = 'cancelled'`
- **THEN** a new appointment covering the same time range for the same staff member is accepted

#### Scenario: Two different staff members can overlap
- **WHEN** two staff members each have appointments with overlapping time ranges
- **THEN** both appointments coexist without constraint violation

### Requirement: Customers can create an appointment via the `create_appointment` RPC
The system SHALL provide a SECURITY DEFINER function `create_appointment(p_service_id uuid, p_starts_at timestamptz)` callable by `authenticated` users. The function SHALL validate the service, enforce the booking policy window, enforce `max_concurrent_bookings`, auto-assign the first available staff member ordered by `staff_members.created_at ASC`, compute `ends_at` server-side, insert the appointment with `status = 'confirmed'`, and return the new appointment row.

#### Scenario: Successful booking returns confirmed appointment
- **WHEN** an authenticated customer calls `create_appointment` with a valid service and a starts_at within the booking window
- **THEN** the function inserts a row with `status = 'confirmed'`, `ends_at = starts_at + service.duration_minutes`, the auto-assigned `staff_member_id`, and returns `id, service_id, staff_member_id, starts_at, ends_at, status, created_at`

#### Scenario: Unauthenticated call is denied
- **WHEN** an anonymous user calls `create_appointment`
- **THEN** the function raises an error and no appointment is created

#### Scenario: Booking outside the policy window is rejected
- **WHEN** `p_starts_at` is before `now() + booking_min_notice_minutes` or after `now() + booking_max_horizon_days`
- **THEN** the function raises `BOOKING_OUTSIDE_POLICY_WINDOW`

#### Scenario: Booking rejected when capacity is exhausted
- **WHEN** the service has `max_concurrent_bookings = N` and there are already N overlapping `pending`/`confirmed` appointments for that service across all staff
- **THEN** the function raises `BOOKING_CAPACITY_EXCEEDED`

#### Scenario: Booking rejected when no staff is available
- **WHEN** all active staff assigned to the service have an overlapping `pending`/`confirmed` appointment
- **THEN** the function raises `BOOKING_NO_STAFF_AVAILABLE`

#### Scenario: Service not found or inactive is rejected
- **WHEN** `p_service_id` does not match an active service
- **THEN** the function raises `BOOKING_SERVICE_NOT_FOUND`

#### Scenario: Null max_concurrent_bookings means no limit
- **WHEN** the service has `max_concurrent_bookings IS NULL`
- **THEN** the capacity check is skipped and booking proceeds if a staff member is available

### Requirement: TypeScript service function translates booking errors into Spanish
The system SHALL provide `createAppointment(params: { serviceId: string; startsAt: string }): Promise<NewAppointment>` in `src/services/appointments.ts`. The function SHALL call the `create_appointment` RPC, map the response to a typed `NewAppointment` object, and translate known Postgres error codes and `P0001` raise messages into user-facing Spanish strings.

#### Scenario: Successful call returns typed NewAppointment
- **WHEN** the RPC returns a valid appointment row
- **THEN** `createAppointment` resolves with `{ id, serviceId, staffMemberId, startsAt, endsAt, status, createdAt }` using camelCase keys

#### Scenario: Constraint violation (23P01) is translated to Spanish
- **WHEN** the RPC throws an error with code `23P01`
- **THEN** `createAppointment` rejects with "El horario seleccionado ya no está disponible. Por favor, seleccioná otro turno."

#### Scenario: BOOKING_NO_STAFF_AVAILABLE is translated to Spanish
- **WHEN** the RPC raises `P0001` with message `BOOKING_NO_STAFF_AVAILABLE`
- **THEN** `createAppointment` rejects with "El horario seleccionado ya no está disponible. Por favor, seleccioná otro turno."

#### Scenario: BOOKING_CAPACITY_EXCEEDED is translated to Spanish
- **WHEN** the RPC raises `P0001` with message `BOOKING_CAPACITY_EXCEEDED`
- **THEN** `createAppointment` rejects with "El turno seleccionado ya no tiene disponibilidad. Por favor, elegí otro."

#### Scenario: BOOKING_OUTSIDE_POLICY_WINDOW is translated to Spanish
- **WHEN** the RPC raises `P0001` with message `BOOKING_OUTSIDE_POLICY_WINDOW`
- **THEN** `createAppointment` rejects with "Este horario ya no está dentro del rango de reservas permitido."

#### Scenario: BOOKING_SERVICE_NOT_FOUND is translated to Spanish
- **WHEN** the RPC raises `P0001` with message `BOOKING_SERVICE_NOT_FOUND`
- **THEN** `createAppointment` rejects with "El servicio seleccionado no está disponible."

#### Scenario: isConflictError identifies all conflict codes
- **WHEN** `isConflictError(err)` is called with an error having code `23P01`, `23505`, or `P0001` with a booking-related message
- **THEN** it returns `true`; for other errors it returns `false`

### Requirement: BookingPage Step 4 shows a review screen and submits the booking
The system SHALL extend the existing 3-step `BookingPage` wizard with a Step 4 review/confirm screen. The screen SHALL display the service name, formatted date and time in the organization's timezone, duration, and price. It SHALL provide a "Confirmar reserva" primary CTA that calls `createAppointment` and a back button to return to Step 3. On success it SHALL navigate to `/booking/confirmation/:appointmentId`. On conflict or no-staff errors it SHALL show an inline Spanish error message and a "Elegir otro turno" CTA that returns the user to Step 3.

#### Scenario: Step 4 renders review information
- **WHEN** the customer has selected a service, date, and slot and advances to Step 4
- **THEN** the screen displays the service name, formatted date/time (org timezone), duration in minutes, and price

#### Scenario: "Confirmar reserva" calls createAppointment
- **WHEN** the customer clicks "Confirmar reserva"
- **THEN** `createAppointment` is called with the selected service ID and slot `starts_at`

#### Scenario: Successful booking navigates to confirmation
- **WHEN** `createAppointment` resolves successfully
- **THEN** the user is navigated to `/booking/confirmation/:appointmentId`

#### Scenario: Conflict error shows inline message and back CTA
- **WHEN** `createAppointment` rejects with a conflict or no-staff error
- **THEN** an inline Spanish error message is shown and a "Elegir otro turno" button returns the user to Step 3

### Requirement: `/booking/confirmation/:appointmentId` route is registered as role-restricted
The system SHALL register `/booking/confirmation/:appointmentId` in `src/lib/routing.ts` as `role-restricted` with `allowedRoles: ['customer']`. A stub page SHALL be registered in `App.tsx` for the route.

#### Scenario: Route policy exists for confirmation path
- **WHEN** `getRoutePolicy('/booking/confirmation/some-id')` is called
- **THEN** a policy with `access: 'role-restricted'` and `allowedRoles: ['customer']` is returned

#### Scenario: Unauthenticated user navigating to confirmation is redirected
- **WHEN** an unauthenticated user navigates to `/booking/confirmation/:appointmentId`
- **THEN** they are redirected to `/signin`
