### Requirement: WeeklyCalendar and MonthlyCalendar group appointments by local calendar date in org timezone
Both `WeeklyCalendar` and `MonthlyCalendar` components SHALL derive the calendar day for each appointment using the organization's IANA timezone (passed as `orgTimezone` prop) rather than the raw UTC date string. The conversion MUST use `Intl.DateTimeFormat` with the `timeZone` option. No third-party date library SHALL be introduced.

#### Scenario: Appointment near midnight maps to correct local day
- **WHEN** an appointment has `startsAt = "2026-05-17T01:00:00Z"` and `orgTimezone = "America/Argentina/Buenos_Aires"` (UTC-3)
- **THEN** the appointment appears on the May 16 column (not May 17)

#### Scenario: Appointment maps to correct UTC day when timezone matches UTC
- **WHEN** `orgTimezone = "UTC"` and `startsAt = "2026-05-17T01:00:00Z"`
- **THEN** the appointment appears on the May 17 column

---

### Requirement: WeeklyCalendar supports drag-and-drop appointment reschedule for all roles
The `WeeklyCalendar` component SHALL wrap its day columns with DnD context provided by `@dnd-kit/core`. Each `pending` or `confirmed` appointment block SHALL be a draggable element. `cancelled`, `completed`, and `no_show` appointments SHALL render without a drag handle (no drag interaction). When a draggable appointment is dropped onto a different day column, a `SlotPickerModal` MUST open, populated with available slots for `(appointment.serviceId, droppedDate)`. Dropping onto the same day the appointment currently occupies SHALL be a no-op.

#### Scenario: Draggable appointment has a drag handle
- **WHEN** an appointment has status `pending` or `confirmed`
- **THEN** the appointment block renders with a drag handle and grab cursor

#### Scenario: Non-draggable appointment has no drag handle
- **WHEN** an appointment has status `cancelled`, `completed`, or `no_show`
- **THEN** the appointment block renders without a drag handle (not-allowed or default cursor)

#### Scenario: Drop on a different day opens slot picker modal
- **WHEN** a user drags an appointment and drops it onto a different day column
- **THEN** `SlotPickerModal` opens, calls `getAvailableSlots(serviceId, newDate)`, and displays available slots

#### Scenario: Drop on same day is a no-op
- **WHEN** a user drags an appointment and drops it onto the column for the same local day
- **THEN** no modal opens and no RPC is called

#### Scenario: Slot selection triggers reschedule
- **WHEN** the user selects a slot in `SlotPickerModal`
- **THEN** `rescheduleAppointment(appointmentId, newStartsAt)` is called and the modal shows a loading state

#### Scenario: Reschedule conflict shows Spanish error in modal
- **WHEN** `rescheduleAppointment` fails with a conflict or no-staff error
- **THEN** an inline Spanish error is displayed inside the modal with an "Elegir otro horario" retry option

#### Scenario: Customer policy violation shows Spanish error in modal
- **WHEN** a customer drops an appointment within the min-notice window and selects a slot that violates `booking_min_notice_minutes`
- **THEN** a Spanish policy error is shown inside the modal

#### Scenario: Successful reschedule closes modal and updates appointment inline
- **WHEN** `rescheduleAppointment` succeeds
- **THEN** the modal closes and the appointment card reflects the updated `startsAt` without a full page reload

---

### Requirement: Staff weekly calendar renders an availability overlay
When rendered in the staff context (`/staff/appointments`), the `WeeklyCalendar` component SHALL accept optional `staffSchedule` and `scheduleExceptions` props. When provided, each day column SHALL shade working-hour windows with a light indigo background and non-working-hour windows with a neutral gray. A `day_off` exception for a date SHALL render the entire column in gray with a "Día libre" label. A `custom_hours` exception SHALL render the custom window (not the weekly template) as the working hours. A business closure exception SHALL render the column in gray with a "Cerrado" label.

#### Scenario: Working hours are shaded indigo
- **WHEN** a day is a working day per the staff's weekly schedule or custom_hours exception
- **THEN** the working-hours range is shaded with a light indigo background in that day column

#### Scenario: Non-working hours are shaded gray
- **WHEN** a day has working hours defined
- **THEN** hours outside the working window are shaded with a neutral gray background

#### Scenario: day_off exception grays out entire column
- **WHEN** a date has a `day_off` exception in `staff_schedule_exceptions`
- **THEN** the entire column renders in gray with a "Día libre" label

#### Scenario: custom_hours exception overrides weekly template
- **WHEN** a date has a `custom_hours` exception
- **THEN** the custom working window is used for overlay shading instead of the weekly template for that day

#### Scenario: Business closure grays out column with Cerrado label
- **WHEN** a date is blocked by a full-day business closure exception
- **THEN** the column renders in gray with a "Cerrado" label

---

### Requirement: Admin calendar route at /admin/calendar shows all org appointments with DnD reschedule
The system SHALL provide an `AdminCalendarPage` at `/admin/calendar`, accessible only to users with the `admin` role (enforced by `RoleGuard`). The page SHALL display a weekly calendar view of all organization appointments for the visible week, fetched via `adminListAppointments()` with `dateFrom`/`dateTo` filters covering Monday 00:00 UTC to Sunday 23:59 UTC. Appointment blocks SHALL show customer name and service name. Admin users SHALL be able to drag `pending` or `confirmed` appointments to a different day → slot picker modal → `rescheduleAppointment`. The admin navigation menu SHALL include a "Calendario" link after "Turnos". Loading, empty, and error states MUST be in Spanish.

#### Scenario: Admin accesses /admin/calendar
- **WHEN** an authenticated admin navigates to `/admin/calendar`
- **THEN** the page loads and calls `adminListAppointments()` with the current week's date range

#### Scenario: Non-admin is denied
- **WHEN** a non-admin user navigates to `/admin/calendar`
- **THEN** the `RoleGuard` redirects to the unauthorized page

#### Scenario: Admin calendar shows appointment with customer and service name
- **WHEN** the admin calendar renders an appointment block
- **THEN** the block displays the customer name and service name (2-line, truncated)

#### Scenario: Admin drags appointment to reschedule
- **WHEN** an admin drags a `pending` or `confirmed` appointment to a different day
- **THEN** `SlotPickerModal` opens and the admin can select a slot and confirm

#### Scenario: Empty week shows Spanish empty state
- **WHEN** no appointments exist in the visible week
- **THEN** a Spanish empty-state message is displayed (e.g., "No hay turnos esta semana.")

#### Scenario: Error loading appointments shows Spanish error state
- **WHEN** the `adminListAppointments()` call fails
- **THEN** a Spanish error message is displayed

---

### Requirement: WeeklyCalendar is responsive and collapses to single-day strip on mobile
At breakpoints below `md` (768px), the `WeeklyCalendar` component SHALL render as a single-day vertical strip rather than a 7-column grid. The strip SHALL display the appointments for the current day with full-width appointment blocks. Prev/next day navigation arrows SHALL allow the user to move one day at a time. Today SHALL be shown on initial render.

#### Scenario: Weekly calendar renders single-day strip on mobile
- **WHEN** the viewport width is below `md` (768px)
- **THEN** only one day column is rendered with full-width appointment blocks

#### Scenario: Prev/next arrows navigate by one day on mobile
- **WHEN** the user taps the next arrow in the mobile single-day view
- **THEN** the displayed day advances by one calendar day

#### Scenario: Today is shown on initial mobile render
- **WHEN** the mobile weekly calendar mounts
- **THEN** the current local date (in org timezone) is the initially visible day
