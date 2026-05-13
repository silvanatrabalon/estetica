## MODIFIED Requirements

### Requirement: Role-Based Route Access Control
The system SHALL enforce role-based route access for routes restricted to `customer`, `staff`, or `admin` roles, including admin-only operational settings routes, admin-only staff management routes, and admin-only staff availability configuration routes.

#### Scenario: Authorized role accesses restricted route
- **WHEN** an authenticated user with a permitted role requests a restricted route
- **THEN** the system renders the requested route

#### Scenario: Non-permitted role accesses restricted route
- **WHEN** an authenticated user with a non-permitted role requests a restricted route
- **THEN** the system redirects the user to `/unauthorized`

#### Scenario: Admin accesses business settings route
- **WHEN** an authenticated user with role `admin` requests the business settings route
- **THEN** the system renders the admin-only business settings experience

#### Scenario: Admin accesses staff management route
- **WHEN** an authenticated user with role `admin` requests the staff management route
- **THEN** the system renders the admin-only staff management experience

#### Scenario: Non-admin attempts staff management route
- **WHEN** an authenticated user without role `admin` attempts to access the staff management route
- **THEN** the system redirects the user to `/unauthorized`

#### Scenario: Admin accesses staff availability route
- **WHEN** an authenticated user with role `admin` requests the staff availability route (`/admin/staff/:staffId/availability`)
- **THEN** the system renders the admin-only staff availability configuration experience

#### Scenario: Non-admin attempts staff availability route
- **WHEN** an authenticated user without role `admin` attempts to access the staff availability route
- **THEN** the system redirects the user to `/unauthorized`
