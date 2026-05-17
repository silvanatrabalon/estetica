## MODIFIED Requirements

### Requirement: Admin navigation includes landing config entry
The system SHALL add a **"Página pública"** nav entry to the admin navigation section pointing to `/admin/settings/landing`. The entry MUST appear in `navigationByRole.admin` and be protected by `RoleGuard` in `routePolicies`. The label MUST be "Página pública" (not "Personalizar Landing" or any term containing "Landing").

#### Scenario: Admin sees Página pública in navigation
- **WHEN** an admin is authenticated and views the navigation
- **THEN** a "Página pública" link is visible pointing to `/admin/settings/landing`

#### Scenario: Route is registered in routePolicies
- **WHEN** the router resolves `/admin/settings/landing`
- **THEN** the route matches `admin` role guard and renders `LandingConfigPage`
