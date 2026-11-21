## MODIFIED Requirements

### Requirement: Admin navigation includes landing config entry
The system SHALL add an **"Apariencia"** nav entry to the admin navigation section pointing to `/admin/appearance`. The entry MUST appear in `navigationByRole.admin` and be protected by `RoleGuard` in `routePolicies`. The landing configuration form MUST be rendered in the "Página pública" tab of that page. The former path `/admin/settings/landing` MUST redirect to `/admin/appearance`.

#### Scenario: Admin sees Apariencia in navigation
- **WHEN** an admin is authenticated and views the navigation
- **THEN** an "Apariencia" link is visible pointing to `/admin/appearance`

#### Scenario: Route is registered in routePolicies
- **WHEN** the router resolves `/admin/appearance`
- **THEN** the route matches the `admin` role guard and renders `AppearancePage`, whose "Página pública" tab hosts the landing configuration form

#### Scenario: Old route redirects
- **WHEN** the router resolves `/admin/settings/landing`
- **THEN** it redirects to `/admin/appearance`
