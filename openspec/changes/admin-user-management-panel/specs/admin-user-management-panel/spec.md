## ADDED Requirements

### Requirement: Admin User Directory Coverage
The system MUST provide an admin-only user directory at `/admin/users` that includes authenticated accounts even when a profile row does not exist.

#### Scenario: Admin opens user directory
- **WHEN** an authenticated admin navigates to `/admin/users`
- **THEN** the system displays a directory that includes users with and without profile rows

#### Scenario: Non-admin attempts directory access
- **WHEN** an authenticated non-admin user attempts to access admin user directory behavior
- **THEN** the system denies access through existing authorization mechanisms

### Requirement: Deterministic Directory State UX
The system MUST expose deterministic loading, empty, success, and recoverable error states for admin user directory workflows.

#### Scenario: Directory loading state
- **WHEN** the directory data is being fetched
- **THEN** the UI shows a loading state in Spanish

#### Scenario: Directory empty state
- **WHEN** no user records are available for the directory query
- **THEN** the UI shows an empty state in Spanish with no broken actions

#### Scenario: Directory recoverable error state
- **WHEN** directory retrieval fails
- **THEN** the UI shows a recoverable error message in Spanish and allows retry

### Requirement: Global Role Management
The system MUST allow admin-only role updates for canonical global roles `customer`, `staff`, and `admin`.

#### Scenario: Admin updates user role
- **WHEN** an authenticated admin confirms a valid role change for a target user
- **THEN** the system persists the new canonical role and reflects the result in the admin UI

#### Scenario: Non-admin attempts role update
- **WHEN** a non-admin actor attempts to update another user's role
- **THEN** the mutation is denied by authorization controls

### Requirement: Role Safety Invariants
The system MUST block role actions that cause self-demotion or leave the system without any active admin users.

#### Scenario: Self-demotion attempt
- **WHEN** an admin attempts to remove their own required admin role
- **THEN** the system rejects the action and surfaces an explanatory message

#### Scenario: Last-admin lockout attempt
- **WHEN** an admin action would result in zero active admin users
- **THEN** the system rejects the action and preserves at least one active admin

### Requirement: Reversible Global User Deactivation
The system MUST support admin-only global user deactivation and reactivation, where deactivated users are blocked from application access behavior.

#### Scenario: Admin deactivates user
- **WHEN** an authenticated admin confirms deactivation for an active user
- **THEN** the user status becomes inactive and subsequent app access behavior for that user is blocked

#### Scenario: Admin reactivates user
- **WHEN** an authenticated admin confirms reactivation for an inactive user
- **THEN** the user status becomes active and standard app access behavior is restored

### Requirement: MVP Admin User Analytics
The system MUST provide lightweight admin-only analytics for user operations: total users, active vs inactive users, role distribution, and recent signups in the last 30 days.

#### Scenario: Admin views user analytics summary
- **WHEN** an authenticated admin loads the admin users panel
- **THEN** the UI shows the four agreed MVP user analytics KPIs

### Requirement: Spanish User-Facing Admin Copy
The system MUST present user-facing admin panel copy in Spanish for user management states and action feedback.

#### Scenario: Action feedback is shown
- **WHEN** role or deactivation actions succeed or fail
- **THEN** the visible feedback copy is displayed in Spanish

### Requirement: Test Coverage For Admin User Management MVP
The system MUST include automated tests for critical user management behavior.

#### Scenario: Frontend coverage execution
- **WHEN** frontend test suites run for this capability
- **THEN** unit and integration coverage validates directory states, role changes, deactivation/reactivation, and non-admin denial paths

#### Scenario: SQL/RLS smoke execution
- **WHEN** database smoke tests run for this capability
- **THEN** admin-only mutation paths are allowed and non-admin mutation paths are denied
