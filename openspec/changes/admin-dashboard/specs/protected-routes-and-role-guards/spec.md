## MODIFIED Requirements

### Requirement: Deterministic Redirect Rules
The system SHALL apply deterministic redirect behavior for sign-in and role-home entry points.

#### Scenario: Authenticated user opens sign-in route
- **WHEN** an authenticated user navigates to the sign-in route
- **THEN** the system redirects the user to the configured role home route

#### Scenario: Role home mapping is applied
- **WHEN** the system resolves role-home redirection
- **THEN** it maps `customer` to `/dashboard`, `staff` to `/staff/schedule`, and `admin` to `/admin/dashboard`
