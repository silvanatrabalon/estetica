## MODIFIED Requirements

### Requirement: Role-Based Route Access Control
The system SHALL enforce role-based route access for routes restricted to `customer`, `staff`, or `admin` roles, including admin-only operational settings routes.

#### Scenario: Authorized role accesses restricted route
- **WHEN** an authenticated user with a permitted role requests a restricted route
- **THEN** the system renders the requested route

#### Scenario: Non-permitted role accesses restricted route
- **WHEN** an authenticated user with a non-permitted role requests a restricted route
- **THEN** the system redirects the user to `/unauthorized`

#### Scenario: Admin accesses business settings route
- **WHEN** an authenticated user with role `admin` requests the business settings route
- **THEN** the system renders the admin-only business settings experience