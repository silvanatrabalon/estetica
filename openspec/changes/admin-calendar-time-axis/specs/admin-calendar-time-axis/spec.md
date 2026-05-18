## ADDED Requirements

### Requirement: Admin calendar has a Día (day) view with time-axis layout
The `AdminCalendarPage` SHALL provide a view-mode toggle with options **Día** and **Semana**. When **Día** is selected, the page SHALL render a `DayView` component displaying a vertical time-axis grid from `business_hours.opens_at` to `business_hours.closes_at` for the selected date. If no `business_hours` row exists for that weekday, the grid SHALL fall back to 08:00–20:00. Each appointment block SHALL be absolutely positioned using `top = (appointmentStartMinutes - gridOpenMinutes) * PX_PER_MIN` and `height = max(durationMinutes * PX_PER_MIN, MIN_BLOCK_HEIGHT_PX)` where `PX_PER_MIN = 1` and the grid uses a CSS scale (1 hour = 60px). Each block SHALL display the customer name and service name (2-line, truncated). Navigation SHALL provide prev/next day arrows and a "Hoy" shortcut that resets the selected date to today. Loading, empty ("Sin turnos para este día"), and error states MUST be in Spanish.

#### Scenario: Day view renders appointment block at correct top position
- **WHEN** business opens at 09:00 and an appointment starts at 10:30 (90 min duration)
- **THEN** the block has `top = 90px` (90 minutes from 09:00) and `height = 90px`

#### Scenario: Appointment at exactly open time has top = 0
- **WHEN** an appointment starts at the same wall-clock minute as `business_hours.opens_at`
- **THEN** the block has `top = 0`

#### Scenario: Day view empty state shows Spanish copy
- **WHEN** no appointments exist on the selected date
- **THEN** "Sin turnos para este día" is displayed

#### Scenario: "Hoy" button resets selected date to today
- **WHEN** the user clicks "Hoy"
- **THEN** the day view navigates to the current local date in org timezone

#### Scenario: Prev/next arrows change the selected day by one day
- **WHEN** the user clicks the next arrow
- **THEN** the selected date advances by exactly one calendar day and a new fetch is triggered

#### Scenario: Fallback grid hours when no business_hours row exists
- **WHEN** `business_hours` has no row for the selected weekday
- **THEN** the time-axis grid renders from 08:00 to 20:00

### Requirement: Admin calendar org timezone is resolved from appointment data
`AdminCalendarPage` SHALL derive `orgTimezone` from the `orgTimezone` field of the first appointment row returned by `adminListAppointments`. If no appointments are present, it SHALL fall back to `'America/Argentina/Buenos_Aires'`. The `AdminAppointmentRow` type SHALL include `orgTimezone: string`. All time rendering (block positions, time labels, day grouping) MUST use this resolved timezone.

#### Scenario: Appointments rendered in org timezone
- **WHEN** `orgTimezone` is `"America/Argentina/Buenos_Aires"` and an appointment starts at `"2026-05-18T12:00:00Z"`
- **THEN** the appointment block renders at 09:00 local time (UTC-3)

#### Scenario: Fallback timezone used when no appointments
- **WHEN** `adminListAppointments` returns an empty result
- **THEN** `orgTimezone` defaults to `'America/Argentina/Buenos_Aires'`
