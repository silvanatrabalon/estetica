## ADDED Requirements

### Requirement: SPA Route Foundation
The system SHALL provide SPA routing for authenticated and public UI paths so internal navigation does not require full document reloads.

#### Scenario: User navigates between app routes
- **WHEN** a user navigates from one registered route to another
- **THEN** the system updates the rendered route view without a full page reload

### Requirement: Authentication Guard for Protected Routes
The system SHALL protect authenticated routes so unauthenticated users cannot access them.

#### Scenario: Unauthenticated user requests protected route
- **WHEN** a user without an active authenticated session attempts to access a protected path
- **THEN** the system redirects the user to the sign-in route

### Requirement: Role-Based Route Access Control
The system SHALL enforce role-based route access for routes restricted to `customer`, `staff`, or `admin` roles, including admin-only operational settings routes, admin-only staff management routes, and admin-only staff availability configuration routes. Route guards MUST evaluate the **active role** from `UserContext` (not all assigned roles) to determine access for the current session context.

#### Scenario: Authorized active role accesses restricted route
- **WHEN** an authenticated user whose current active role is a permitted role requests a restricted route
- **THEN** the system renders the requested route

#### Scenario: Non-permitted active role accesses restricted route
- **WHEN** an authenticated user whose current active role is not a permitted role requests a restricted route
- **THEN** the system redirects the user to `/unauthorized`

#### Scenario: Multi-role user with permitted active role accesses route
- **WHEN** a user with multiple assigned roles has selected an active role that permits the route
- **THEN** the system renders the requested route based on the active role

#### Scenario: Multi-role user switches to non-permitted active role
- **WHEN** a user with multiple assigned roles switches to an active role that does not permit the current route
- **THEN** the system redirects the user away from the now-unauthorized route

#### Scenario: Admin accesses business settings route
- **WHEN** an authenticated user with active role `admin` requests the business settings route
- **THEN** the system renders the admin-only business settings experience

#### Scenario: Admin accesses staff management route
- **WHEN** an authenticated user with active role `admin` requests the staff management route
- **THEN** the system renders the admin-only staff management experience

#### Scenario: Admin accesses staff availability configuration route
- **WHEN** an authenticated user with active role `admin` requests the staff availability configuration route
- **THEN** the system renders the admin-only staff availability configuration experience

#### Scenario: Non-admin attempts staff availability configuration route
- **WHEN** an authenticated user without active role `admin` attempts to access the staff availability configuration route
- **THEN** the system redirects the user to `/unauthorized`

#### Scenario: Non-admin attempts staff management route
- **WHEN** an authenticated user without active role `admin` attempts to access the staff management route
- **THEN** the system redirects the user to `/unauthorized`

### Requirement: Deterministic Redirect Rules
The system SHALL apply deterministic redirect behavior for sign-in and role-home entry points.

#### Scenario: Authenticated user opens sign-in route
- **WHEN** an authenticated user navigates to the sign-in route
- **THEN** the system redirects the user to the configured role home route

#### Scenario: Role home mapping is applied
- **WHEN** the system resolves role-home redirection
- **THEN** it maps `customer` to `/dashboard`, `staff` to `/staff/schedule`, and `admin` to `/admin/users`

### Requirement: Unauthorized and Not-Found Handling
The system SHALL provide explicit handling for unauthorized access and unknown paths.

#### Scenario: Unauthorized access is denied
- **WHEN** access is denied by route role policy
- **THEN** the system renders or redirects to `/unauthorized` with clear recovery navigation

#### Scenario: Unknown path is requested
- **WHEN** a user requests a path not present in the route registry
- **THEN** the system renders the not-found route

### Requirement: Null-Role Recovery Handling
The system SHALL handle persistent null-role resolution with a recoverable error state.

#### Scenario: Role cannot be resolved after session restoration
- **WHEN** the user session is authenticated but role resolution remains null beyond normal loading
- **THEN** the system shows a recoverable error state with retry action instead of silently assigning a fallback role

### Requirement: Route Policy Test Coverage
The system MUST include automated tests that validate route policy and guard behavior.

#### Scenario: Route policy and redirects are tested
- **WHEN** the routing test suite is executed
- **THEN** it validates policy evaluation, guard states, redirect outcomes, and navigation-policy coherence for guest and role-based flows

### Requirement: Scope Isolation from Data Authorization
This capability MUST remain limited to UI route protection behavior.

#### Scenario: Scope validation
- **WHEN** this change is reviewed for completeness
- **THEN** it includes no Supabase RLS changes, no database permission changes, and no resource-level ACL implementation
