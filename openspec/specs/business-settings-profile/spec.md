## ADDED Requirements

### Requirement: Admin-Only Business Settings Management
The system MUST provide an admin-only business settings experience for the single salon where authorized admins can load and update canonical business configuration.

#### Scenario: Admin opens business settings
- **WHEN** an authenticated admin navigates to the business settings page
- **THEN** the system loads the canonical business settings for the single salon and renders the editable settings experience

#### Scenario: Non-admin attempts business settings access
- **WHEN** an authenticated non-admin user attempts to access business settings behavior
- **THEN** the system denies access through existing authorization mechanisms

### Requirement: Canonical Business Identity And Branding
The system MUST persist the single business identity and basic branding in the database as canonical business configuration.

#### Scenario: Admin updates business identity and branding
- **WHEN** an authenticated admin saves valid business identity and branding changes
- **THEN** the system persists the visible business name, logo, primary brand color, and booking header or subtitle text as canonical business settings

### Requirement: Canonical Business Timezone
The system MUST store one canonical IANA timezone for the business and use it as the local-time context for business scheduling configuration.

#### Scenario: Admin saves valid business timezone
- **WHEN** an authenticated admin submits a valid IANA timezone value
- **THEN** the system persists that timezone as the canonical timezone for business scheduling and display behavior

#### Scenario: Invalid timezone is rejected
- **WHEN** an admin submits a timezone value outside the supported IANA timezone set
- **THEN** the system rejects the update and preserves the previously valid timezone

### Requirement: Weekly Business Hours
The system MUST support weekly operating hours for the business itself, separate from any future staff-level availability.

#### Scenario: Admin configures open business day
- **WHEN** an authenticated admin saves a weekday as open with valid opening and closing times
- **THEN** the system persists the weekly business-hours entry for that weekday

#### Scenario: Admin configures closed business day
- **WHEN** an authenticated admin marks a weekday as closed
- **THEN** the system persists that weekday as closed without requiring opening and closing times

#### Scenario: Invalid business hours are rejected
- **WHEN** an admin submits a day where opening time is not earlier than closing time
- **THEN** the system rejects the invalid schedule update and preserves valid stored hours

### Requirement: Business Closure Exceptions
The system MUST support one-off business closure exceptions for both full-day and half-day closures.

#### Scenario: Admin creates full-day closure
- **WHEN** an authenticated admin saves a closure exception for a full day on a specific business-local date
- **THEN** the system persists the full-day closure and makes it available as canonical business closure data

#### Scenario: Admin creates half-day closure
- **WHEN** an authenticated admin saves a closure exception with a valid partial-day time range on a specific business-local date
- **THEN** the system persists the half-day closure with its local start and end times

#### Scenario: Invalid half-day closure is rejected
- **WHEN** an admin submits a half-day closure whose start time is not earlier than its end time
- **THEN** the system rejects the closure update and preserves previously valid closure data

### Requirement: Singleton Business Resolution
The system MUST guarantee that the single-tenant product can resolve exactly one canonical business record for settings operations.

#### Scenario: Business record does not exist yet
- **WHEN** the system initializes business settings in an environment with no existing organization record
- **THEN** it creates or guarantees one canonical business record for the salon before admin settings operations proceed

#### Scenario: Business settings are requested after bootstrap
- **WHEN** the app resolves business settings after the singleton business record exists
- **THEN** it uses that canonical business record rather than frontend-hardcoded identifiers

### Requirement: Business Readiness Warning
The system MUST compute whether minimum business configuration is incomplete and expose that state as a warning without blocking app usage.

#### Scenario: Business configuration is incomplete
- **WHEN** the business is missing required configuration such as visible name, canonical timezone, or at least one valid open business-hours entry
- **THEN** the system marks business readiness as incomplete and surfaces a warning state to admins without blocking the application

#### Scenario: Business configuration becomes ready
- **WHEN** the minimum required business configuration is present
- **THEN** the system clears the readiness warning state

### Requirement: Spanish User-Facing Business Settings Copy
The system MUST present visible business settings UI copy in Spanish for loading, validation, warning, success, and error states.

#### Scenario: Business settings feedback is shown
- **WHEN** business settings actions succeed, fail, or surface readiness warnings
- **THEN** the visible business settings copy is displayed in Spanish

### Requirement: Test Coverage For Business Settings MVP
The system MUST include automated test coverage for critical business settings behavior.

#### Scenario: Frontend coverage execution
- **WHEN** frontend test suites run for business settings
- **THEN** unit and integration coverage validates admin-only access, timezone and schedule validation, closure exception handling, and readiness warning states

#### Scenario: SQL and RLS smoke execution
- **WHEN** database smoke tests run for business settings
- **THEN** singleton persistence, schedule constraints, closure constraints, and admin-only mutation paths are validated

### Requirement: Global Booking Policy Configuration In Business Settings
The system MUST expose a "Configuración de reservas" section in the Business Settings admin page where admins can configure the global booking policy: minimum advance notice and maximum booking horizon.

#### Scenario: Admin opens Business Settings and sees booking policy section
- **WHEN** an authenticated admin navigates to the Business Settings page
- **THEN** the system renders a "Configuración de reservas" section with the current values of booking_min_notice_minutes and booking_max_horizon_days

#### Scenario: Admin saves valid booking policy
- **WHEN** an authenticated admin submits valid values for minimum notice (0–10080 minutes) and maximum horizon (1–365 days)
- **THEN** the system persists both values on the organization record and shows a Spanish success message

#### Scenario: Min notice value out of range is rejected
- **WHEN** an admin submits booking_min_notice_minutes below 0 or above 10080
- **THEN** the system rejects the submission and shows a Spanish validation message

#### Scenario: Horizon value out of range is rejected
- **WHEN** an admin submits booking_max_horizon_days below 1 or above 365
- **THEN** the system rejects the submission and shows a Spanish validation message

#### Scenario: Default booking policy is loaded after migration
- **WHEN** the organization record is loaded in Business Settings after the booking configuration migration
- **THEN** booking_min_notice_minutes is 60 and booking_max_horizon_days is 60 unless previously changed
