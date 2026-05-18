## REMOVED Requirements

### Requirement: Today's Appointments Widget
**Reason**: Removed to simplify the admin dashboard. The widget adds noise without clear operational value when admins already have `/admin/appointments` for full appointment management.
**Migration**: Use `/admin/appointments` with a "today" date filter to view today's appointments. The "Ver todos los turnos" CTA is also removed.

### Requirement: Quick-Access Cards
**Reason**: Removed to reduce visual clutter on the dashboard. Navigation via the sidebar provides the same access; the quick-access cards duplicate navigation.
**Migration**: Use the admin sidebar navigation to reach Turnos, Calendario, Profesionales, and Servicios.

## MODIFIED Requirements

### Requirement: Booking Analytics Status Breakdown
The page SHALL render a status-breakdown analytics section driven by a date-range preset selector with options: **Hoy**, **Último mes**, **Últimos 6 meses**, **Último año**. The selected range SHALL filter both the status-breakdown table and the analytics KPI cards for that period. The status-breakdown table SHALL show: Confirmado, Pendiente, Cancelado, Completado — each with count and percentage of total. The "No presentado" row MUST NOT appear. Fixed-window KPI cards ("Turnos hoy", "Turnos esta semana") remain independent of the date-range selector. The analytics section MUST call `admin_get_stats_by_range(p_date_from, p_date_to)` RPC. This requirement is BLOCKED on the #44d migration (`admin_get_stats_by_range` RPC).

#### Scenario: Date-range preset selected
- **WHEN** the admin selects "Último mes"
- **THEN** `admin_get_stats_by_range` is called with `p_date_from` = today minus 30 days and `p_date_to` = today

#### Scenario: Breakdown table reflects selected range
- **WHEN** a date-range preset is active
- **THEN** the status-breakdown table shows counts and percentages for appointments within that range

#### Scenario: No presentado row absent
- **WHEN** the analytics section renders
- **THEN** no "No presentado" / `no_show` row appears in the breakdown table

#### Scenario: Fixed KPI cards unaffected by range selector
- **WHEN** the admin changes the date-range preset
- **THEN** "Turnos hoy" and "Turnos esta semana" stat cards retain their fixed-window values

#### Scenario: Analytics loading state in Spanish
- **WHEN** `admin_get_stats_by_range` is in-flight
- **THEN** a skeleton or Spanish loading indicator is shown for the analytics section

#### Scenario: Analytics error state in Spanish
- **WHEN** `admin_get_stats_by_range` fails
- **THEN** a Spanish error message is shown in the analytics section

### Requirement: Admin Dashboard Page and Route
The system SHALL render `AdminDashboardPage` at `/admin/dashboard` under a `RoleGuard` allowing only the `admin` role. The page SHALL display KPI metric cards and a booking analytics section with a date-range selector. The "Turnos de hoy" widget and "Accesos rápidos" cards SHALL NOT be rendered.

#### Scenario: Admin navigates to /admin/dashboard
- **WHEN** an authenticated admin user navigates to `/admin/dashboard`
- **THEN** the dashboard page renders with KPI cards and the analytics section; no quick-access cards or today's widget are shown

#### Scenario: Non-admin attempts /admin/dashboard
- **WHEN** an authenticated non-admin user navigates to `/admin/dashboard`
- **THEN** the system redirects to `/unauthorized`
