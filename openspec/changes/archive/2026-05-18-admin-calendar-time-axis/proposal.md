## Why

The admin calendar at `/admin/calendar` currently renders appointments as simple chips per day, giving no sense of duration or time position. An admin cannot tell at a glance whether two appointments overlap, how long a service takes, or how packed a given hour is — all critical information for a booking-based business. Introducing a time-axis layout (like Google Calendar) makes the calendar operationally useful.

## What Changes

- The admin calendar gains a **Día** (day) view: a vertical time-axis grid from business open to close, with appointments rendered as absolutely-positioned blocks whose height is proportional to `duration_minutes`.
- The existing **Semana** (weekly) view is upgraded from a chip-per-day layout to the same time-axis block layout across 7 day columns.
- Navigation for the day view: prev/next day arrows + "Hoy" shortcut.
- No new DB tables or migrations — all data (`starts_at`, `ends_at`, `duration_minutes` via service join) is already available from `adminListAppointments`.

## Capabilities

### New Capabilities

- `admin-calendar-time-axis`: Daily and weekly time-axis calendar view for the admin, rendering appointments as duration-proportional blocks positioned on a vertical hour grid.

### Modified Capabilities

- `calendar-system-ui`: The existing weekly calendar view behavior changes — appointments move from chip-per-day to time-axis positioned blocks. The weekly view's rendering contract is updated.

## Impact

- **Modified components**: `AdminCalendarPage`, `WeeklyCalendar` (from `calendar-system-ui` spec/feature)
- **New component**: `DayView` (or `TimeAxisGrid`) — a reusable time-axis grid used by both the day and weekly views
- **Reused utilities**: `formatSlotTime` (#16), `adminListAppointments` (#23), `business_hours` data (#10)
- **No DB changes**
- **Dependencies**: `@dnd-kit` already installed from #25; no new npm packages needed
