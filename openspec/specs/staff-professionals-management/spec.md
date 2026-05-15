## Purpose
Admin capability to manage staff professionals: create, edit, deactivate/reactivate staff members linked to existing users, and navigate to per-member availability and service assignment sub-pages.
## Requirements
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

### Requirement: Create Staff Member Linked To Existing User
The system MUST allow admins to create a staff member by selecting an existing app user and providing a display name.

#### Scenario: Admin creates staff member
- **WHEN** an authenticated admin selects an existing user and provides a valid display name and submits
- **THEN** the system creates a staff member record linked to that user and the new staff member appears in the directory

#### Scenario: Creating staff member auto-assigns staff role
- **WHEN** an admin creates a staff member linked to a user who does not have the `staff` role
- **THEN** the system assigns the `staff` role to that user automatically as part of the create operation

#### Scenario: Creating staff member for user who already has staff role
- **WHEN** an admin creates a staff member linked to a user who already has the `staff` or `admin` role
- **THEN** the system creates the staff member without changing the existing role

#### Scenario: Duplicate staff member is rejected
- **WHEN** an admin attempts to create a staff member for a user who is already linked to an existing staff member
- **THEN** the system rejects the operation and surfaces a descriptive error in Spanish

#### Scenario: Display name validation fails
- **WHEN** an admin submits a display name that is empty or fewer than 2 characters
- **THEN** the system rejects the input and displays a validation error in Spanish

### Requirement: Edit Staff Member Display Name And Status
The system MUST allow admins to edit a staff member's display name and active status.

#### Scenario: Admin edits display name
- **WHEN** an authenticated admin submits a valid updated display name for a staff member
- **THEN** the system persists the new display name

#### Scenario: Admin edits invalid display name
- **WHEN** an admin submits a display name that is empty or fewer than 2 characters
- **THEN** the system rejects the input and displays a validation error in Spanish

### Requirement: Reversible Staff Member Deactivation
The system MUST support reversible deactivation of staff members without hard deletion.

#### Scenario: Admin deactivates active staff member
- **WHEN** an authenticated admin deactivates an active staff member
- **THEN** the staff member is marked as inactive and the change is reflected in the directory

#### Scenario: Admin reactivates inactive staff member
- **WHEN** an authenticated admin reactivates an inactive staff member
- **THEN** the staff member is marked as active and the change is reflected in the directory

#### Scenario: Deactivation does not revoke app access
- **WHEN** an admin deactivates a staff member
- **THEN** the staff member's app user account access is not revoked; only the staff member record is marked inactive

### Requirement: Spanish User-Facing Staff Management Copy
The system MUST present all staff management UI copy in Spanish for loading, validation, warning, success, and error states.

#### Scenario: Staff management feedback is shown
- **WHEN** staff management actions succeed, fail, or require confirmation
- **THEN** all visible copy is displayed in Spanish

### Requirement: Test Coverage For Staff Management MVP
The system MUST include automated test coverage for critical staff management behavior.

#### Scenario: Frontend unit and integration coverage
- **WHEN** frontend test suites run for staff management
- **THEN** unit and integration coverage validates admin-only access, display name validation, create/edit/deactivate/reactivate flows

#### Scenario: RLS smoke coverage
- **WHEN** database smoke tests run for staff management
- **THEN** admin-only mutation paths are validated and non-admin denial is confirmed

