### Requirement: Admin Dashboard Stats RPC
The system SHALL expose a `admin_get_dashboard_stats()` SECURITY DEFINER PostgreSQL function accessible only to authenticated users with the `admin` role. It MUST return a single row with the following integer/bigint fields: `today_count`, `week_count`, `month_count`, `pending_count`, `confirmed_count`, `cancelled_count`, `completed_count`, `revenue_cents_month`. The `no_show_count` field is **REMOVED** from the return shape. `cancelled_count` MUST count only cancelled appointments whose `starts_at` is in the current month of the organization's timezone. All count fields MUST return `0` (not NULL) when no matching rows exist. Time windows (today, this week, this month) MUST be computed using the organization's timezone from `organizations.timezone`, falling back to `UTC` if unset. **BREAKING**: this change requires a `DROP FUNCTION` + `CREATE` migration and must be deployed atomically with the TypeScript interface update and frontend stat card removal.

#### Scenario: Admin calls RPC
- **WHEN** an authenticated user with role `admin` calls `admin_get_dashboard_stats()`
- **THEN** the function returns one row with all KPI fields populated and no NULLs; the response does NOT include `no_show_count`

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
The system SHALL render `AdminDashboardPage` at `/admin/dashboard` under a `RoleGuard` allowing only the `admin` role. The page SHALL show today's date in Spanish as its heading, the today agenda (next appointment and the day's list), and four KPI metric cards. The page MUST NOT render a "Panel de administración" title, an "En vivo" chip, "Accesos rápidos" cards, or a date-range analytics section.

#### Scenario: Admin navigates to /admin/dashboard
- **WHEN** an authenticated admin user navigates to `/admin/dashboard`
- **THEN** the dashboard renders the date heading, the today agenda and the four KPI cards, and none of the removed pieces

#### Scenario: Non-admin attempts /admin/dashboard
- **WHEN** an authenticated non-admin user navigates to `/admin/dashboard`
- **THEN** the system redirects to `/unauthorized`

#### Scenario: Date is the page heading
- **WHEN** the dashboard renders
- **THEN** the only level-1 heading is today's date, e.g. "Sábado, 21 de noviembre de 2026"

### Requirement: Admin Navigation Entry
The system SHALL include "Inicio" as the first navigation item for the admin role in `navigationByRole.admin`, linking to `/admin/dashboard`. The "Reportes" entry MUST be removed from `navigationByRole.admin`.

#### Scenario: Admin views the navigation
- **WHEN** an admin user is authenticated and views the app shell navigation
- **THEN** "Inicio" appears as the first nav item linking to `/admin/dashboard`

#### Scenario: Reports not in admin nav
- **WHEN** an admin user is authenticated and views the app shell navigation
- **THEN** no "Reportes" link is visible in the nav

### Requirement: KPI Metric Cards
The page SHALL render four `StatCard` components: "Turnos hoy" (`today_count`), "Turnos esta semana" (`week_count`), "Turnos este mes" (`month_count`) and "Cancelados este mes" (`cancelled_count`, only cancelled appointments whose start falls in the current month of the organization time zone). The cards "Confirmados + pendientes hoy" and "Ingresos estimados este mes" MUST NOT be rendered. Each card MUST show a loading skeleton while data is being fetched and a Spanish error message on failure.

#### Scenario: Data loaded
- **WHEN** `getAdminDashboardStats()` resolves
- **THEN** each StatCard displays its corresponding value

#### Scenario: Data loading
- **WHEN** the stats fetch is in-flight
- **THEN** each StatCard renders a skeleton placeholder, not a blank or zero value

#### Scenario: Stats fetch fails
- **WHEN** `getAdminDashboardStats()` rejects
- **THEN** the page displays a Spanish error message and does not crash

### Requirement: Admin Dashboard KPI stat cards are responsive on mobile
The KPI metric `StatCard` components on `AdminDashboardPage` SHALL render their title labels fully at all viewport widths, including mobile. Titles MUST NOT be truncated with ellipsis on narrow screens. The card layout SHALL use `text-sm` and allow text wrapping so that labels remain legible at all breakpoints.

#### Scenario: Stat card title does not truncate on a narrow mobile viewport
- **WHEN** the admin dashboard renders on a viewport of 375 px width
- **THEN** all stat card titles (e.g., "Turnos esta semana") are fully visible without truncation or overflow clipping

#### Scenario: Stat card title wraps when needed
- **WHEN** a stat card title is longer than the available card width at a narrow breakpoint
- **THEN** the title wraps to the next line rather than being cut off

### Requirement: Admin Dashboard Today Agenda
The dashboard SHALL show a "Próximo turno" card and the day's list ("Hoy · N turnos") built from today's appointments in the business time zone. Cancelled appointments MUST NOT appear. The list MUST be in time order, show each row's time (24-hour), client, service and state ("Confirmado", "Pendiente", "Hecho"), and mark the next appointment as current. The next appointment is the one in progress or the first still to come. The card MUST show how soon it starts ("en N min", "Ahora"). The agenda MUST refresh every minute.

#### Scenario: Next appointment shown first
- **WHEN** there are appointments today that have not ended
- **THEN** the "Próximo turno" card shows the first of them with its time, client, service, professional and how soon it starts

#### Scenario: Nothing today
- **WHEN** there are no appointments today
- **THEN** the card says "Hoy no tenés turnos." and no list is shown

#### Scenario: Day is over
- **WHEN** every appointment of today has ended
- **THEN** the card says "No quedan turnos por hoy." and the list still shows the day

#### Scenario: Agenda fails to load
- **WHEN** the appointments request fails
- **THEN** a Spanish error alert is shown in the agenda and the KPI cards still render

### Requirement: Cancelled card is a monthly figure
The "Cancelados este mes" card MUST show only the cancelled appointments of the current month, so it is comparable with "Turnos este mes". The label MUST say "este mes".

#### Scenario: Old cancellations do not count
- **WHEN** an appointment was cancelled in a previous month
- **THEN** it is not included in the "Cancelados este mes" figure

#### Scenario: Cancellation in the current month counts
- **WHEN** an appointment that starts this month is cancelled
- **THEN** the figure includes it

