## Why

Step 3 of the customer booking wizard currently shows available time slots as a flat 3-column grid of identical square buttons. This gives customers no sense of time of day, slot duration, or the day's overall rhythm. A time-axis day view — already used in the admin calendar — communicates availability intuitively and is consistent with how appointments are visualized throughout the product.

## What Changes

- **New component** `BookingSlotDayView` (`src/components/booking/BookingSlotDayView.tsx`): a read-only time-axis view that positions available slots as absolutely-placed clickable blocks on a scrollable time grid, using the same `getTopPx`/`getHeightPx`/`getGridHeightPx` utilities from `src/lib/timeAxis.ts` as `DayView`.
- **BookingPage Step 3 replaced**: the `<div className="grid grid-cols-3 gap-2">` button grid is removed and replaced with `<BookingSlotDayView>`, passing `slots`, `selectedSlot`, `onSelectSlot`, `orgTimezone`, `openTime`, and `closeTime` as props. All other step logic (step navigation, `useAvailableSlots` hook, state) is unchanged.
- **No new data fetching**: `orgOpenTime`/`orgCloseTime` are already in `BookingPage` state from the business settings loaded on mount.

## Capabilities

### New Capabilities

- `booking-slot-day-view`: Customer-facing time-axis slot picker component; renders `AvailableSlot[]` as clickable blocks on a time grid; supports selected/unselected states, loading skeleton, and empty state.

### Modified Capabilities

- `appointment-booking`: Step 3 UI behavior changes — slot selection now uses a time-axis view instead of a flat grid. The slot data contract (`AvailableSlot { starts_at, ends_at }`) and step navigation logic are unchanged; only the rendering component is replaced.

## Impact

- **Modified files**: `src/pages/BookingPage.tsx` (Step 3 render replaced)
- **New files**: `src/components/booking/BookingSlotDayView.tsx`, `src/components/booking/BookingSlotDayView.test.tsx`
- **No DB changes**, no new RPCs, no migration required
- **Dependencies**: `src/lib/timeAxis.ts` (existing), `src/services/availability.ts` `AvailableSlot` type (existing), `formatSlotTime` utility (existing)
- **Visual reference**: `src/components/appointments/DayView.tsx` — the new component follows the same time-grid pattern
