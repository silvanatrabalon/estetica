## ADDED Requirements

### Requirement: Admin-Only Staff Availability Template
The system MUST allow admins to configure a recurring weekly availability template for each staff member. The template repeats indefinitely until explicitly changed by an admin.

#### Scenario: Admin opens staff availability page
- **WHEN** an authenticated admin navigates to `/admin/staff/:staffId/availability`
- **THEN** the system loads and displays the staff member's current weekly availability template and exception date list

#### Scenario: Staff with no template configured shows empty state
- **WHEN** an admin opens the availability page for a staff member with no schedule set
- **THEN** the system displays an empty state with a call to action to configure the weekly template

#### Scenario: Non-admin attempts to access staff availability route
- **WHEN** an authenticated user without role `admin` attempts to access `/admin/staff/:staffId/availability`
- **THEN** the system denies access through existing authorization mechanisms

### Requirement: Weekly Availability Template Persistence
The system MUST persist a staff member's recurring weekly availability as a 7-day template stored atomically. Each day specifies whether the staff member works that day and their start/end times.

#### Scenario: Admin saves weekly availability template
- **WHEN** an authenticated admin submits a valid 7-day availability template for a staff member
- **THEN** the system atomically replaces the previous template and persists the new one

#### Scenario: Admin saves template with no working days
- **WHEN** an admin submits a weekly template where no days are marked as working
- **THEN** the system rejects the input and displays a validation error in Spanish

#### Scenario: Admin saves working day with invalid time range
- **WHEN** an admin submits a working day where start time is equal to or later than end time
- **THEN** the system rejects the input and displays a validation error in Spanish

### Requirement: Staff Availability Exception Dates
The system MUST allow admins to register one-off exception dates for a staff member. An exception either marks the staff member as fully unavailable that day (`day_off`) or overrides their hours with custom times (`custom_hours`).

#### Scenario: Admin adds a day-off exception
- **WHEN** an authenticated admin adds a `day_off` exception for a specific date
- **THEN** the system persists the exception and the date is reflected in the exception list

#### Scenario: Admin adds a custom-hours exception
- **WHEN** an authenticated admin adds a `custom_hours` exception with valid start and end times for a specific date
- **THEN** the system persists the exception and the date is reflected in the exception list

#### Scenario: Admin removes an exception date
- **WHEN** an authenticated admin removes an existing exception for a specific date
- **THEN** the system deletes the exception and the staff member reverts to their weekly template for that date

#### Scenario: Duplicate exception date is rejected
- **WHEN** an admin attempts to add an exception for a date that already has an exception registered for that staff member
- **THEN** the system rejects the operation and displays a descriptive error in Spanish

### Requirement: Spanish User-Facing Staff Availability Copy
The system MUST present all staff availability UI copy in Spanish for loading, validation, warning, success, and error states.

#### Scenario: Staff availability feedback is shown
- **WHEN** staff availability actions succeed, fail, or require confirmation
- **THEN** all visible copy is displayed in Spanish

### Requirement: Test Coverage For Staff Availability MVP
The system MUST include automated test coverage for critical staff availability behavior.

#### Scenario: Frontend unit and integration coverage
- **WHEN** frontend test suites run for staff availability
- **THEN** unit and integration coverage validates admin-only access, time range validation, weekly template save/load flows, and exception date add/remove flows

#### Scenario: RLS and constraint smoke coverage
- **WHEN** database smoke tests run for staff availability
- **THEN** admin-only mutation paths are validated via RPC, direct non-admin writes are denied, and constraint violations on invalid hours are confirmed
