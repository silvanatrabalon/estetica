## MODIFIED Requirements

### Requirement: Admin-Only Staff Directory
The system MUST provide an admin-only staff directory that displays all staff members with their active/inactive status, linked user information, and action links to manage availability and assigned services.

#### Scenario: Admin opens staff management page
- **WHEN** an authenticated admin navigates to the staff management page
- **THEN** the system loads and displays all staff members with their display name, active status, linked user name, a link to manage availability, and a link to manage assigned services

#### Scenario: Non-admin attempts staff management access
- **WHEN** an authenticated non-admin user attempts to access the staff management page
- **THEN** the system denies access through existing authorization mechanisms

#### Scenario: Staff directory shows empty state
- **WHEN** an admin opens the staff directory with no staff members created yet
- **THEN** the system displays an empty state with a call to action to create the first staff member
