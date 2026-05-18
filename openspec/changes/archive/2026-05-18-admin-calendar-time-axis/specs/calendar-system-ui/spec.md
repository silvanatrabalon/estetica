## MODIFIED Requirements

### Requirement: Admin calendar route at /admin/calendar shows all org appointments with DnD reschedule
The system SHALL provide an `AdminCalendarPage` at `/admin/calendar`, accessible only to users with the `admin` role (enforced by `RoleGuard`). The page SHALL display a view-mode toggle with **Día** and **Semana** options. In **Semana** mode, appointments SHALL be rendered as time-axis positioned blocks (height proportional to duration) within each day column of a 7-column grid — replacing the previous chip-per-day layout. In **Día** mode, a single-day time-axis view SHALL be shown (see `admin-calendar-time-axis` spec). Appointments are fetched via `adminListAppointments()` with `dateFrom`/`dateTo` filters. Appointment blocks SHALL show customer name and service name. Admin users SHALL be able to drag `pending` or `confirmed` appointments in the weekly view → slot picker modal → `rescheduleAppointment`. The admin navigation menu SHALL include a "Calendario" link after "Turnos". Loading, empty, and error states MUST be in Spanish.

#### Scenario: Admin accesses /admin/calendar
- **WHEN** an authenticated admin navigates to `/admin/calendar`
- **THEN** the page loads in Semana mode and calls `adminListAppointments()` with the current week's date range

#### Scenario: Non-admin is denied
- **WHEN** a non-admin user navigates to `/admin/calendar`
- **THEN** the `RoleGuard` redirects to the unauthorized page

#### Scenario: Weekly view renders appointment blocks with proportional height
- **WHEN** the admin calendar is in Semana mode and an appointment has `duration_minutes = 60`
- **THEN** the appointment block's height equals 60px (1px per minute at default scale)

#### Scenario: Admin calendar shows appointment with customer and service name
- **WHEN** the admin calendar renders an appointment block
- **THEN** the block displays the customer name and service name (2-line, truncated)

#### Scenario: Admin drags appointment to reschedule
- **WHEN** an admin drags a `pending` or `confirmed` appointment to a different day
- **THEN** `SlotPickerModal` opens and the admin can select a slot and confirm

#### Scenario: Switching to Día view navigates to today's day view
- **WHEN** the admin clicks the "Día" toggle
- **THEN** the page renders the `DayView` for today's date

#### Scenario: Empty week shows Spanish empty state
- **WHEN** no appointments exist in the visible week
- **THEN** a Spanish empty-state message is displayed (e.g., "No hay turnos esta semana.")

#### Scenario: Error loading appointments shows Spanish error state
- **WHEN** the `adminListAppointments()` call fails
- **THEN** a Spanish error message is displayed
