## Context

The admin calendar at `/admin/calendar` (`AdminCalendarPage`) currently renders only a `WeeklyCalendar` component — a 7-column chip-per-day grid where each appointment appears as a small truncated chip with no visual representation of duration or time position. `@dnd-kit/core` is already installed. `formatSlotTime` and `toLocalDateKey` utilities exist. `adminListAppointments` returns `starts_at`, `ends_at`, and `duration_minutes` (via service join) for every appointment.

The `WeeklyCalendar` component is self-contained: it manages its own week navigation and drag-and-drop reschedule logic. `AdminCalendarPage` maps `AdminAppointmentRow` → `AppointmentSummary` and passes a flat array to `WeeklyCalendar`.

Currently `orgTimezone` is hardcoded to `'UTC'` in `AdminCalendarPage` because `AdminAppointmentRow` does not carry timezone. The `toAppointmentSummary` mapper sets `orgTimezone: 'UTC'`.

## Goals / Non-Goals

**Goals:**
- Add a **Día** view to `AdminCalendarPage`: a vertical time-axis grid for a single day showing appointments as height-proportional positioned blocks.
- Upgrade the existing **Semana** weekly view from chip-per-day to time-axis block layout (same proportional height and `top` positioning per day column).
- Add view-mode toggle (Día / Semana) to `AdminCalendarPage`.
- Day view navigation: prev/next day arrows + "Hoy" button.
- Fix `orgTimezone` so appointment times render in the org's local timezone (requires pulling `orgTimezone` from the admin appointment rows or org settings).

**Non-Goals:**
- Drag-to-create from empty time slots.
- Drag-to-reschedule in the time-axis view (existing DnD in `WeeklyCalendar` is chip-based; time-axis DnD is a separate concern).
- Staff availability overlay in time-axis views.
- Monthly calendar view changes.
- Customer or staff calendar time-axis views.

## Decisions

### 1. New `TimeAxisGrid` component, keep `WeeklyCalendar` for chip layout

**Decision:** Create a new `TimeAxisGrid` component (used by both the day view and a new `TimeAxisWeeklyCalendar`) rather than retrofitting the existing `WeeklyCalendar`. 

**Rationale:** `WeeklyCalendar` is tightly coupled to the chip layout and DnD chip logic. Modifying it in-place risks regressions in the customer/staff views that also use it. The time-axis layout needs fundamentally different CSS (absolute positioning within a relative container) that is incompatible with the current flex/grid chip approach. Keeping `WeeklyCalendar` unchanged means customer and staff views are unaffected.

**Alternative considered:** Extend `WeeklyCalendar` with a `layout="time-axis"` prop. Rejected — the internal structure diverges too much between chip and block layouts.

### 2. Pixel scale: 1 minute = 1px (× scale factor via CSS var)

**Decision:** Use a constant `PX_PER_MIN = 1` with a CSS scale multiplier of `60` (so 1 hour = 60px). A `--px-per-min` CSS custom property on the grid container allows adjusting zoom without changing component logic.

**Block positioning formula:**
```
const gridOpenMinutes = openHour * 60  // minutes from midnight
const topPx = (appointmentStartMinutes - gridOpenMinutes) * PX_PER_MIN
const heightPx = Math.max(durationMinutes * PX_PER_MIN, MIN_BLOCK_HEIGHT_PX)
```
`MIN_BLOCK_HEIGHT_PX = 22` — ensures very short appointments (e.g. 15 min) remain legible.

**Rationale:** Simple arithmetic, easy to test, no third-party layout library needed.

### 3. Grid bounds from `business_hours`

**Decision:** The time-axis grid renders from `business_hours.opens_at` to `business_hours.closes_at` for the selected day. If no `business_hours` row exists for the day, fall back to 08:00–20:00.

**Data source:** Call `getBusinessSettings()` (already available in the app) on page mount and derive open/close times from the `businessHours` array. Pass `openHour` and `closeHour` as props to the grid component.

**Rationale:** Avoids rendering an empty 24-hour grid for a business that operates 09:00–18:00. Consistent with how the slot generator interprets business hours.

### 4. `orgTimezone` fix: pull from admin row

**Decision:** Extend `AdminAppointmentRow` to include `orgTimezone: string` (populated from the existing `organizations.timezone` join already present in `admin_list_appointments` RPC — it returns `org_timezone` in the result set). Update `toAppointmentSummary` mapper in `AdminCalendarPage` accordingly.

**Rationale:** Without the correct timezone, `toLocalDateKey` groups appointments to the wrong day and `formatSlotTime` displays wrong times. This fix is a prerequisite for correctness, not just polish.

### 5. View-mode state lives in `AdminCalendarPage`

**Decision:** `AdminCalendarPage` owns a `view: 'day' | 'week'` state and a `selectedDate: Date` state. It passes the appropriate data slice to whichever view component is rendered.

**Rationale:** Keeps each calendar component (chip `WeeklyCalendar`, new `TimeAxisWeeklyCalendar`, new `DayView`) stateless/presentation-focused. The page re-fetches data when the date/week window changes.

## Risks / Trade-offs

- **[Risk] Appointment blocks overlap when two appointments share the same staff slot** → For MVP, overlapping blocks stack visually (last rendered is on top). Full column-split layout (like Google Calendar's side-by-side rendering) is deferred.
- **[Risk] `business_hours` fetch adds a second network call on page load** → `getBusinessSettings()` is already called by the admin settings pages; wrapping it in a shared context or caching it client-side would avoid the duplicate call. For MVP, a direct call on mount is acceptable given volume.
- **[Risk] `orgTimezone` change in `AdminAppointmentRow` requires verifying the RPC returns it** → Check `admin_list_appointments` SQL to confirm `org_timezone` is in the SELECT list. If not, add it to the RPC result (no migration needed — it's already joined).
