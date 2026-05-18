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
The system SHALL render `AdminDashboardPage` at `/admin/dashboard` under a `RoleGuard` allowing only the `admin` role.

#### Scenario: Admin navigates to /admin/dashboard
- **WHEN** an authenticated admin user navigates to `/admin/dashboard`
- **THEN** the dashboard page renders with KPI cards, today's appointments widget, and quick-access cards

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

### Requirement: Today's Appointments Widget
The page SHALL display up to 10 appointments for the current date in the org's timezone, reusing `adminListAppointments` with `dateFrom`/`dateTo` set to today. The widget MUST show columns: hora, cliente, servicio, profesional, estado (with status badge). It MUST include a "Ver todos los turnos" CTA linking to `/admin/appointments`. When no appointments exist for today, it MUST display "No hay turnos para hoy."

#### Scenario: Appointments exist today
- **WHEN** there are appointments for today
- **THEN** the widget lists them (up to 10) with all required columns

#### Scenario: No appointments today
- **WHEN** there are no appointments for today
- **THEN** the widget shows "No hay turnos para hoy."

#### Scenario: CTA links to appointments
- **WHEN** the user clicks "Ver todos los turnos"
- **THEN** the system navigates to `/admin/appointments`

### Requirement: Quick-Access Cards
The page SHALL render four quick-access link cards: "Turnos" → `/admin/appointments`, "Calendario" → `/admin/calendar`, "Profesionales" → `/admin/staff`, "Servicios" → `/admin/services`.

#### Scenario: Quick-access cards render
- **WHEN** the admin dashboard page is rendered
- **THEN** all four quick-access cards are visible with their labels and correct links

### Requirement: Booking Analytics Status Breakdown
The page SHALL render a monthly status-breakdown table for the current month showing: Confirmado, Pendiente, Cancelado, Completado, No presentado — each with count and percentage of total. Values are derived from the `admin_get_dashboard_stats` RPC scalars; no additional RPC call is required.

#### Scenario: Analytics table renders with data
- **WHEN** stats are loaded
- **THEN** the table shows each status row with count and percentage (0% if total is zero)

#### Scenario: Analytics table loading state
- **WHEN** stats are loading
- **THEN** the analytics section shows a skeleton or loading indicator

### Requirement: Admin Dashboard KPI stat cards are responsive on mobile
The KPI metric `StatCard` components on `AdminDashboardPage` SHALL render their title labels fully at all viewport widths, including mobile. Titles MUST NOT be truncated with ellipsis on narrow screens. The card layout SHALL use `text-sm` and allow text wrapping so that labels remain legible at all breakpoints.

#### Scenario: Stat card title does not truncate on a narrow mobile viewport
- **WHEN** the admin dashboard renders on a viewport of 375 px width
- **THEN** all stat card titles (e.g., "Ingresos estimados este mes") are fully visible without truncation or overflow clipping

#### Scenario: Stat card title wraps when needed
- **WHEN** a stat card title is longer than the available card width at a narrow breakpoint
- **THEN** the title wraps to the next line rather than being cut off
