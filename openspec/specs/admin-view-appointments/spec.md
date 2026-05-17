## ADDED Requirements

### Requirement: admin_list_appointments RPC returns paginated, filtered appointment data for admins
The system SHALL provide an `admin_list_appointments(p_statuses text[], p_date_from timestamptz, p_date_to timestamptz, p_page integer, p_page_size integer)` SECURITY DEFINER PostgreSQL function granted to the `authenticated` role. The function MUST raise a permission error if the caller is not an admin (`is_admin()` returns false). It MUST return all organization appointments joined with `service_name`, `staff_display_name`, `customer_name` (from `profiles.full_name`, falling back to `auth.users.email`, then `'—'`), along with `id`, `starts_at`, `ends_at`, `status`, and `created_at`. NULL parameter values MUST be treated as "no filter" for each dimension. Results MUST be ordered by `starts_at DESC`. The function MUST return a `total_count` column reflecting the total filtered row count (before pagination) alongside each data row, computed via `COUNT(*) OVER()`. Default page size MUST be 50 when `p_page_size` is NULL.

#### Scenario: Admin calls with no filters
- **WHEN** an admin calls `admin_list_appointments(NULL, NULL, NULL, 1, NULL)`
- **THEN** all organization appointments are returned (up to page size 50), ordered by `starts_at DESC`, with `total_count` reflecting the full unfiltered count

#### Scenario: Non-admin caller is rejected
- **WHEN** a non-admin authenticated user calls `admin_list_appointments`
- **THEN** a permission error is raised

#### Scenario: Unauthenticated caller is rejected
- **WHEN** an unauthenticated caller invokes `admin_list_appointments`
- **THEN** a permission error is raised

#### Scenario: Status filter returns only matching rows
- **WHEN** admin calls with `p_statuses = ARRAY['cancelled']`
- **THEN** only appointments with `status = 'cancelled'` are returned

#### Scenario: Multiple statuses filter returns union of matching rows
- **WHEN** admin calls with `p_statuses = ARRAY['pending', 'confirmed']`
- **THEN** only appointments with `status IN ('pending', 'confirmed')` are returned

#### Scenario: Date from filter excludes earlier appointments
- **WHEN** admin calls with `p_date_from` set to a specific timestamp
- **THEN** only appointments with `starts_at >= p_date_from` are returned

#### Scenario: Date to filter excludes later appointments
- **WHEN** admin calls with `p_date_to` set to a specific timestamp
- **THEN** only appointments with `starts_at <= p_date_to` are returned

#### Scenario: Combined date range filters correctly
- **WHEN** admin calls with both `p_date_from` and `p_date_to`
- **THEN** only appointments with `starts_at` within the range are returned

#### Scenario: Pagination returns correct page
- **WHEN** admin calls with `p_page = 2` and `p_page_size = 10`
- **THEN** the second page of 10 results is returned (rows 11–20)

#### Scenario: total_count reflects filtered row count
- **WHEN** admin calls with a status filter that matches 15 rows
- **THEN** `total_count` equals 15 for every returned row, regardless of page size

#### Scenario: customer_name falls back to email when full_name is null
- **WHEN** a customer's `profiles.full_name` is NULL
- **THEN** `customer_name` contains the customer's email from `auth.users`

#### Scenario: customer_name falls back to em dash when both full_name and email are null
- **WHEN** both `profiles.full_name` and `auth.users.email` are NULL
- **THEN** `customer_name` is `'—'`

#### Scenario: Result includes all required joined fields
- **WHEN** admin calls `admin_list_appointments`
- **THEN** each row contains `id`, `starts_at`, `ends_at`, `status`, `service_name`, `staff_display_name`, `customer_name`, `created_at`, and `total_count`

---

### Requirement: Admin can view and filter all appointments at /admin/appointments
The system SHALL provide an `AdminAppointmentsPage` at `/admin/appointments`, accessible only to users with the `admin` role (enforced by `RoleGuard allowedRoles={['admin']}`). The page MUST display a table/list with columns: **cliente**, **servicio**, **profesional**, **fecha/hora**, **estado**. The page MUST include a filters panel with status multi-select chips (values: `pending`, `confirmed`, `cancelled`, `completed`, `no_show`) and two date inputs for date range (`desde`, `hasta`). The page MUST include previous/next pagination controls and a current page indicator. Status badges MUST use the same color system as the customer `AppointmentsPage`. All user-facing copy MUST be in Spanish.

#### Scenario: Page loads and displays all appointments on mount
- **WHEN** an admin navigates to `/admin/appointments`
- **THEN** the page calls `admin_list_appointments` with no filters and displays the first page of results

#### Scenario: Loading state shown in Spanish
- **WHEN** appointments are being fetched
- **THEN** a Spanish loading indicator is shown (e.g., "Cargando turnos...")

#### Scenario: Empty state shown in Spanish when no results
- **WHEN** the filtered result set is empty
- **THEN** a Spanish empty-state message is shown (e.g., "No hay turnos que coincidan con los filtros.")

#### Scenario: Error state shown in Spanish
- **WHEN** the RPC call fails
- **THEN** a Spanish error message is displayed (e.g., "Ocurrió un error al cargar los turnos.")

#### Scenario: Status filter chip selection triggers re-fetch
- **WHEN** the admin selects one or more status chips
- **THEN** `admin_list_appointments` is called with the selected statuses and the result list updates

#### Scenario: Date range filter triggers re-fetch
- **WHEN** the admin enters a date in the "desde" or "hasta" input
- **THEN** `admin_list_appointments` is called with the updated date range

#### Scenario: Clearing all filters shows all appointments
- **WHEN** the admin clears all status chips and date inputs
- **THEN** `admin_list_appointments` is called with all NULL params

#### Scenario: Next page button advances pagination
- **WHEN** the admin clicks the next page control
- **THEN** `admin_list_appointments` is called with `p_page` incremented by 1

#### Scenario: Previous page button retreats pagination
- **WHEN** the admin is on page 2 or higher and clicks the previous page control
- **THEN** `admin_list_appointments` is called with `p_page` decremented by 1

#### Scenario: Previous page button is disabled on page 1
- **WHEN** the admin is on page 1
- **THEN** the previous page control is disabled

#### Scenario: Next page button is disabled on last page
- **WHEN** the current page contains the last row (total_count ≤ page * page_size)
- **THEN** the next page control is disabled

#### Scenario: Applying a filter resets to page 1
- **WHEN** the admin changes a filter while on page 3
- **THEN** the page resets to 1 and re-fetches

#### Scenario: Status badges match AppointmentsPage color system
- **WHEN** an appointment with a given status is rendered
- **THEN** the status badge color matches the equivalent badge on the customer AppointmentsPage

#### Scenario: Non-admin is denied access
- **WHEN** a user without the `admin` role navigates to `/admin/appointments`
- **THEN** they are redirected to `/unauthorized`

---

### Requirement: Admin appointments navigation link is added to admin sidebar
The system SHALL add a navigation link to `/admin/appointments` in the admin sidebar/nav. The link MUST be visible to users with the `admin` active role and MUST use the label "Turnos" (or equivalent Spanish label consistent with the nav design system).

#### Scenario: Admin sidebar shows Turnos link
- **WHEN** an admin views the admin navigation
- **THEN** a "Turnos" (or equivalent) link pointing to `/admin/appointments` is visible

#### Scenario: Turnos link navigates to admin appointments page
- **WHEN** the admin clicks the "Turnos" nav link
- **THEN** the browser navigates to `/admin/appointments`
