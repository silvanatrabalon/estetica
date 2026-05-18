### Requirement: Admin Dashboard Stats RPC
The system SHALL expose a `admin_get_dashboard_stats()` SECURITY DEFINER PostgreSQL function accessible only to authenticated users with the `admin` role. It MUST return a single row with the following integer/bigint fields: `today_count`, `week_count`, `month_count`, `pending_count`, `confirmed_count`, `cancelled_count`, `completed_count`, `no_show_count`, `revenue_cents_month`. All count fields MUST return `0` (not NULL) when no matching rows exist. Time windows (today, this week, this month) MUST be computed using the organization's timezone from `organizations.timezone`, falling back to `UTC` if unset.

#### Scenario: Admin calls RPC
- **WHEN** an authenticated user with role `admin` calls `admin_get_dashboard_stats()`
- **THEN** the function returns one row with all KPI fields populated and no NULLs

#### Scenario: Non-admin calls RPC
- **WHEN** an authenticated user without role `admin` calls `admin_get_dashboard_stats()`
- **THEN** the function raises a permission error

#### Scenario: No appointments exist
- **WHEN** `admin_get_dashboard_stats()` is called and there are no appointments in the org
- **THEN** all count fields return `0` and `revenue_cents_month` returns `0`

#### Scenario: Revenue computed from completed appointments this month
- **WHEN** there are completed appointments in the current calendar month
- **THEN** `revenue_cents_month` equals the SUM of `services.price_cents` for those appointments

#### Scenario: Revenue excludes non-completed appointments
- **WHEN** there are pending or cancelled appointments this month
- **THEN** `revenue_cents_month` does not include their price values

#### Scenario: Today boundary uses org timezone
- **WHEN** the org timezone is `America/Argentina/Buenos_Aires`
- **THEN** `today_count` counts only appointments whose date falls within today in that timezone, not UTC

### Requirement: Admin Dashboard Service Layer
The system SHALL provide `src/services/adminDashboard.ts` exporting an `AdminDashboardStats` TypeScript interface (camelCase field names mirroring the RPC) and a `getAdminDashboardStats(): Promise<AdminDashboardStats>` function that calls the RPC and maps the result.

#### Scenario: Successful fetch
- **WHEN** `getAdminDashboardStats()` is called
- **THEN** it returns a resolved `AdminDashboardStats` object with all fields as numbers

#### Scenario: RPC error is propagated
- **WHEN** the Supabase RPC returns an error
- **THEN** `getAdminDashboardStats()` throws with the error detail

### Requirement: Admin Dashboard Page and Route
The system SHALL render `AdminDashboardPage` at `/admin/dashboard` under a `RoleGuard` allowing only the `admin` role. The page SHALL display KPI metric cards and a booking analytics section with a date-range selector. The "Turnos de hoy" widget and "Accesos rápidos" cards SHALL NOT be rendered.

#### Scenario: Admin navigates to /admin/dashboard
- **WHEN** an authenticated admin user navigates to `/admin/dashboard`
- **THEN** the dashboard page renders with KPI cards and the analytics section; no quick-access cards or today's widget are shown

#### Scenario: Non-admin attempts /admin/dashboard
- **WHEN** an authenticated non-admin user navigates to `/admin/dashboard`
- **THEN** the system redirects to `/unauthorized`

### Requirement: Admin Navigation Entry
The system SHALL include "Inicio" as the first navigation item for the admin role in `navigationByRole.admin`, linking to `/admin/dashboard`. The "Reportes" entry MUST be removed from `navigationByRole.admin`.

#### Scenario: Admin views the navigation
- **WHEN** an admin user is authenticated and views the app shell navigation
- **THEN** "Inicio" appears as the first nav item linking to `/admin/dashboard`

#### Scenario: Reports not in admin nav
- **WHEN** an admin user is authenticated and views the app shell navigation
- **THEN** no "Reportes" link is visible in the nav

### Requirement: KPI Metric Cards
The page SHALL render five `StatCard` components: "Turnos hoy" (`today_count`), "Turnos esta semana" (`week_count`), "Turnos este mes" (`month_count`), "Confirmados + pendientes hoy" (`confirmed_count + pending_count` for today), and "Ingresos estimados este mes" (`revenue_cents_month` formatted as ARS currency). Each card MUST show a loading skeleton while data is being fetched and a Spanish error message on failure.

#### Scenario: Data loaded
- **WHEN** `getAdminDashboardStats()` resolves
- **THEN** each StatCard displays its corresponding value

#### Scenario: Data loading
- **WHEN** the stats fetch is in-flight
- **THEN** each StatCard renders a skeleton placeholder, not a blank or zero value

#### Scenario: Stats fetch fails
- **WHEN** `getAdminDashboardStats()` rejects
- **THEN** the page displays a Spanish error message and does not crash

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

### Requirement: Admin Dashboard KPI stat cards are responsive on mobile
The KPI metric `StatCard` components on `AdminDashboardPage` SHALL render their title labels fully at all viewport widths, including mobile. Titles MUST NOT be truncated with ellipsis on narrow screens. The card layout SHALL use `text-sm` and allow text wrapping so that labels remain legible at all breakpoints.

#### Scenario: Stat card title does not truncate on a narrow mobile viewport
- **WHEN** the admin dashboard renders on a viewport of 375 px width
- **THEN** all stat card titles (e.g., "Ingresos estimados este mes") are fully visible without truncation or overflow clipping

#### Scenario: Stat card title wraps when needed
- **WHEN** a stat card title is longer than the available card width at a narrow breakpoint
- **THEN** the title wraps to the next line rather than being cut off
