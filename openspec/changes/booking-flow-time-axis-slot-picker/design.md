## Context

The booking wizard at `/booking` (4-step flow: Service → Date → Time → Confirm) currently renders Step 3 as a flat `grid grid-cols-3` of uniformly sized time-slot buttons. Every slot looks identical regardless of duration or position in the day, providing no temporal context.

The admin calendar already has a robust time-axis implementation (`DayView`, `TimeAxisWeeklyCalendar`) built on top of shared utilities in `src/lib/timeAxis.ts` (`getTopPx`, `getHeightPx`, `getGridHeightPx`, `PX_PER_MIN`). This design reuses that exact layer to build a customer-facing slot picker with a consistent visual language and zero new positioning logic.

**Current Step 3 state:**
- Renders a flat `grid grid-cols-3 gap-2` of `<button>` elements
- Each button shows only the formatted start time (`formatSlotTime`)
- Clicking a slot immediately advances to Step 4
- No sense of time of day, duration, or visual hierarchy

**Missing data in BookingPage:** `orgOpenTime`/`orgCloseTime` are not currently in `BookingPage` state, even though `getBusinessSettings()` is already called on mount. These fields need to be derived via the same `deriveGridTimes(settings.weeklyHours)` helper used in `AdminCalendarPage`.

## Goals / Non-Goals

**Goals:**
- Replace the Step 3 slot grid with a time-axis view (`BookingSlotDayView`) showing slots as absolutely-positioned clickable blocks
- Allow slot selection within the view; "Siguiente" CTA becomes the progression action (disabled until a slot is chosen)
- Derive `openTime`/`closeTime` from business settings already loaded in `BookingPage` — no new fetches
- Maintain all existing Step 3 states: loading, error, empty, and selected slot
- Reuse `src/lib/timeAxis.ts` utilities without modification

**Non-Goals:**
- Redesigning Step 2 (date picker) — remains `<input type="date">`
- Showing staff name per slot
- Real-time slot refresh
- Drag-and-drop or any DnD dependency
- Modifying the `AvailableSlot` type or `useAvailableSlots` hook

## Decisions

### 1. New component `BookingSlotDayView` rather than adapting `DayView`

`DayView` is purpose-built for admin appointment viewing: it renders `AppointmentSummary[]`, links each block to `/booking/confirmation/:id`, shows customer name and status, and includes prev/next/today navigation controls. Adapting it for customer-facing slot selection would require adding generics, conditional rendering paths, and optional props that complicate the component for all its current callers.

A dedicated `BookingSlotDayView` with its own focused prop surface keeps both components simple and composable.

### 2. `openTime`/`closeTime` derived from existing `getBusinessSettings()` call

`BookingPage` already calls `getBusinessSettings()` on mount and stores `settings.timezone` and `settings.bookingMaxHorizonDays`. The `deriveGridTimes(settings.weeklyHours)` helper (from `AdminCalendarPage`) will be extracted to `src/lib/businessHours.ts` so it can be shared. `BookingPage` will call it and store `orgOpenTime`/`orgCloseTime` in local state. Fallback defaults: `08:00`/`20:00` (same as AdminCalendarPage).

### 3. Click-to-select + "Siguiente" CTA, not click-to-advance

The current button grid immediately advances to Step 4 on click. The time-axis view needs the user to be able to click different slots to compare/reselect before confirming. The new pattern: clicking a slot sets `selectedSlot` state; a "Siguiente" button (disabled until a slot is selected) advances to Step 4. This is more deliberate and matches standard calendar booking UX.

### 4. Duration computed client-side from `ends_at - starts_at`

`AvailableSlot` already carries both `starts_at` and `ends_at` from the RPC. Duration = `Math.round((new Date(ends_at) - new Date(starts_at)) / 60000)` — no service shape change needed. This is the same pattern as `getAppointmentDurationMinutes` in `DayView`.

### 5. `deriveGridTimes` extracted to `src/lib/businessHours.ts`

Rather than duplicating the function or importing from `AdminCalendarPage` (page-to-lib import inversion), the helper moves to the `lib` layer where it belongs. `AdminCalendarPage` imports from the new location; `BookingPage` also imports from there.

## Risks / Trade-offs

**[Risk] `orgOpenTime`/`orgCloseTime` not loaded before Step 3 is reached**
→ Mitigation: `getBusinessSettings()` is called on mount in Step 1 and resolves before the user can navigate to Step 3 (2 clicks minimum). Fallback defaults `08:00`/`20:00` cover the edge case where the fetch is still in-flight.

**[Risk] Tall grid on mobile for long business hours**
→ Mitigation: The component wraps in `overflow-y-auto max-h-[640px]` (same as `DayView`) to keep it scrollable on all viewports.

**[Risk] Slot blocks with very short duration (15–20 min) may be hard to click on mobile**
→ Mitigation: `getHeightPx` uses `MIN_BLOCK_HEIGHT_PX = 22` as a floor, so even very short slots render with minimum tappable height. At `PX_PER_MIN = 2`, a 30-min slot = 60px — comfortable on touch.

**[Trade-off] Click-to-select requires an extra tap vs. current click-to-advance**
→ Accepted: the deliberate two-step interaction (select → confirm with "Siguiente") prevents accidental advancement and is more appropriate for a time-axis view where the user may want to scan and compare before choosing.
