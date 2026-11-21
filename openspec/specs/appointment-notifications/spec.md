### Requirement: Booking Confirmation Email
The system SHALL send a transactional email to all relevant recipients when an appointment is successfully created.

#### Scenario: Booking confirmation sent to customer
- **WHEN** a customer successfully creates an appointment
- **THEN** the system sends a confirmation email to the customer's registered email address containing the service name, formatted date and time in the business timezone, staff display name, and booking reference

#### Scenario: Booking confirmation sent to assigned staff
- **WHEN** a customer successfully creates an appointment and the assigned staff member has a linked email address
- **THEN** the system sends a confirmation email to the staff member's email address

#### Scenario: Booking confirmation sent to admin inbox
- **WHEN** a customer successfully creates an appointment and the organization has a configured `notification_email`
- **THEN** the system sends a confirmation email copy to the configured admin inbox

#### Scenario: Staff has no linked email
- **WHEN** an appointment is created and the assigned staff member has no linked user account or null email
- **THEN** the customer and admin inbox are still notified; the missing staff address is silently skipped

#### Scenario: Admin inbox not configured
- **WHEN** an appointment is created and `organizations.notification_email` is null
- **THEN** the customer and staff are still notified; no admin email is sent

### Requirement: Cancellation Email
The system SHALL send a transactional email to all relevant recipients when an appointment is cancelled.

#### Scenario: Cancellation email sent to customer
- **WHEN** an appointment is successfully cancelled by any actor (customer, staff, or admin)
- **THEN** the system sends a cancellation email to the customer containing the service name and original date/time

#### Scenario: Cancellation email sent to staff and admin
- **WHEN** an appointment is successfully cancelled
- **THEN** the system sends cancellation emails to the assigned staff (if email available) and to the admin inbox (if configured)

### Requirement: Reschedule Email
The system SHALL send a transactional email to all relevant recipients when an appointment is rescheduled to a new time.

#### Scenario: Reschedule email sent to customer
- **WHEN** an appointment is successfully rescheduled by any actor
- **THEN** the system sends a reschedule email to the customer containing the service name and the new date and time in the business timezone

#### Scenario: Reschedule email sent to staff and admin
- **WHEN** an appointment is successfully rescheduled
- **THEN** the system sends reschedule emails to the assigned staff (if email available) and to the admin inbox (if configured)

### Requirement: Recipient Deduplication
The system SHALL send at most one email per unique address per notification event.

#### Scenario: Same person holds multiple roles
- **WHEN** the customer email, staff email, and admin notification email resolve to the same address (case-insensitive)
- **THEN** exactly one email is sent to that address

#### Scenario: Two of three recipients share an email
- **WHEN** two of the three candidate addresses are identical (case-insensitive)
- **THEN** exactly one email is sent to the shared address and one to the distinct address

### Requirement: Fire-and-Forget Notification Delivery
The system SHALL trigger email notifications without blocking the appointment operation that caused them.

#### Scenario: Email delivery does not delay booking confirmation
- **WHEN** an appointment is created, cancelled, or rescheduled
- **THEN** the appointment operation completes and the UI updates immediately, independent of email dispatch latency

#### Scenario: Email provider failure does not affect booking
- **WHEN** the Brevo API returns an error or the Edge Function fails
- **THEN** the appointment operation result is unaffected and the user sees no error related to email delivery

### Requirement: Notification Error Isolation
The system SHALL log notification failures without surfacing them to the end user.

#### Scenario: Edge Function receives a Brevo API error
- **WHEN** the Brevo REST API call fails for any reason
- **THEN** the Edge Function logs the error with `appointmentId` and `eventType` and returns HTTP 200

#### Scenario: Invalid or missing JWT on Edge Function call
- **WHEN** a request reaches the Edge Function without a valid Authorization header
- **THEN** the Edge Function returns HTTP 401 and sends no email

#### Scenario: Unknown eventType received
- **WHEN** the Edge Function receives an `eventType` value not in `['booking_confirmed', 'cancelled', 'rescheduled']`
- **THEN** the Edge Function returns HTTP 400 and sends no email

### Requirement: Spanish Email Templates
The system SHALL send all transactional emails with subject lines and body copy in Spanish (Rioplatense, `vos` form).

#### Scenario: Confirmation email subject and body
- **WHEN** a booking confirmation email is generated
- **THEN** the subject is `"Turno confirmado · {serviceName}"` and the body contains Spanish copy with the customer's name, service, date/time, staff name, booking reference, and a CTA link to the appointment detail page

#### Scenario: Cancellation email subject and body
- **WHEN** a cancellation email is generated
- **THEN** the subject is `"Turno cancelado · {serviceName}"` and the body contains Spanish confirmation of the cancellation with the service name and original date/time

#### Scenario: Reschedule email subject and body
- **WHEN** a reschedule email is generated
- **THEN** the subject is `"Turno reprogramado · {serviceName}"` and the body contains Spanish copy with the service name and the new date and time

### Requirement: Notification Test Coverage
The system MUST include automated test coverage for the notification system behavior.

#### Scenario: Edge Function unit test execution
- **WHEN** Edge Function unit tests run
- **THEN** coverage validates: valid JWT + appointmentId dispatches correct template; invalid JWT returns 401; unknown eventType returns 400; Brevo failure returns 200 with log; null staffEmail skips staff send; null orgNotificationEmail skips admin send; deduplication cases

#### Scenario: Template unit test execution
- **WHEN** template builder unit tests run
- **THEN** each builder returns the correct Spanish subject and HTML containing the required data fields

#### Scenario: Service layer integration test execution
- **WHEN** service layer integration tests run
- **THEN** createAppointment success triggers Edge Function invocation with 'booking_confirmed'; cancelAppointment success triggers 'cancelled'; rescheduleAppointment success triggers 'rescheduled'; RPC failure does not trigger notification
