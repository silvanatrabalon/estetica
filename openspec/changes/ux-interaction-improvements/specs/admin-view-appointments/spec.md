## MODIFIED Requirements

### Requirement: Admin can view and filter all appointments at /admin/appointments
The system SHALL provide an `AdminAppointmentsPage` at `/admin/appointments`, accessible only to users with the `admin` role (enforced by `RoleGuard allowedRoles={['admin']}`). The page MUST display a table/list with columns: **cliente**, **servicio**, **profesional**, **fecha/hora**, **estado**. The page MUST include a filters panel with a `<select>` dropdown for status filtering (options: Todos, Confirmado, Pendiente, Cancelado, Completado — `no_show` MUST NOT appear as an option) and two date inputs for date range (`desde`, `hasta`). The page MUST include previous/next pagination controls and a current page indicator. Status badges MUST use the same color system as the customer `AppointmentsPage`. All user-facing copy MUST be in Spanish.

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

#### Scenario: Status dropdown selection triggers re-fetch
- **WHEN** the admin selects a status from the dropdown
- **THEN** `admin_list_appointments` is called with the selected status and the result list updates

#### Scenario: "Todos" option returns all statuses
- **WHEN** the admin selects "Todos" from the dropdown
- **THEN** `admin_list_appointments` is called with no status filter

#### Scenario: no_show is not available in the dropdown
- **WHEN** the admin opens the status filter dropdown
- **THEN** "No asistió" / `no_show` is not present in the options

#### Scenario: Date range filter triggers re-fetch
- **WHEN** the admin enters a date in the "desde" or "hasta" input
- **THEN** `admin_list_appointments` is called with the updated date range

#### Scenario: Next page button advances pagination
- **WHEN** the admin clicks the next page control
- **THEN** `admin_list_appointments` is called with `p_page` incremented by 1

#### Scenario: Previous page button retreats pagination
- **WHEN** the admin is on page 2 or higher and clicks the previous page control
- **THEN** `admin_list_appointments` is called with `p_page` decremented by 1

#### Scenario: Previous page button is disabled on page 1
- **WHEN** the admin is on page 1
- **THEN** the previous page button is disabled
