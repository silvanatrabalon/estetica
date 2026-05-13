## MODIFIED Requirements

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
