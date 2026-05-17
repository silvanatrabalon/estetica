## Why

The existing weekly and monthly calendar views (from `view-appointments`) are read-only and group appointments by raw UTC date, causing appointments to appear on the wrong calendar day in non-UTC timezones like `America/Argentina/Buenos_Aires`. This item adds the missing interactive layer — drag-and-drop reschedule, staff availability overlay, admin calendar view, and a responsive mobile layout — completing the calendar as a first-class scheduling tool.

## What Changes

- **Bug fix**: `WeeklyCalendar` and `MonthlyCalendar` date grouping corrected from raw UTC slice to timezone-aware local date using `Intl.DateTimeFormat` with `orgTimezone`
- **New**: Drag-and-drop reschedule on the weekly calendar for all roles — drag a `pending`/`confirmed` appointment to a new day → slot picker modal → `rescheduleAppointment` RPC
- **New**: Availability overlay in the staff weekly calendar — working-hours shading, `day_off` and `custom_hours` exception rendering, business closure blocking
- **New**: Admin calendar at `/admin/calendar` — weekly view of all org appointments with admin drag-and-drop reschedule capability
- **New**: Responsive weekly calendar — collapses to a single-day strip on `< md` breakpoints
- No new database tables, migrations, or SECURITY DEFINER RPCs required — all existing infrastructure is reused

## Capabilities

### New Capabilities
- `calendar-system-ui`: Interactive calendar enhancements — timezone-correct date grouping, DnD reschedule on weekly calendar (all roles), staff availability overlay (staff calendar), admin weekly calendar view at `/admin/calendar`, and responsive mobile layout for the weekly grid

### Modified Capabilities
- `view-appointments`: Date grouping logic changes from UTC slice to timezone-aware local date — this is a behavior change visible to users (appointments appear on the correct local day instead of UTC day)
- `reschedule-appointment`: Reschedule is now also triggered from calendar drag-and-drop (in addition to the existing `/appointments/:id/reschedule` route); the `reschedule_appointment` RPC is unchanged

## Impact

- **Components modified**: `WeeklyCalendar.tsx`, `MonthlyCalendar.tsx`, `AppointmentsPage.tsx`, `StaffAppointmentsPage.tsx`
- **New components**: `SlotPickerModal.tsx` (wraps existing `SlotGrid`), `AvailabilityOverlay.tsx`, `AdminCalendarPage.tsx`
- **New dependencies**: `@dnd-kit/core`, `@dnd-kit/modifiers` (no existing DnD library in the project)
- **Routing**: New route `/admin/calendar` (admin-only); new navigation entry "Calendario" in admin sidebar
- **Services**: `adminListAppointments()` reused with `date_from`/`date_to` filters for admin calendar data; direct `staff_schedules` SELECT for availability overlay
- **Tests**: New unit tests for timezone grouping fix, DnD handlers, availability overlay rendering; new integration tests for all three calendar surfaces
