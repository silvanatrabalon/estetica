## Why

Several visual bugs and copy inconsistencies have accumulated across the booking wizard, admin dashboard, and admin panels. These issues affect perceived quality and usability without requiring any backend changes — they can be resolved now as a focused frontend cleanup pass before Phase 11 features add new surface area.

## What Changes

- **Service detail panel**: always open for any service card tap (including services with no description or no image); desktop panel height fixed to fill the viewport with internal scroll
- **Booking slot day view**: fix first hour label clip at top of scroll container; improve color contrast between available, selected, and disabled/past slot blocks
- **Admin dashboard stat cards**: fix label truncation on mobile — titles must render fully at all viewport widths
- **Admin users copy**: rename "Altas" to "Nuevos" in tab label, section heading, and all related copy throughout `/admin/users`
- **Price display (ARS)**: all price values across the app must be formatted as ARS currency (dividing stored `price_cents` by 100) — booking wizard Step 1, Step 4 review, admin services, booking confirmation, admin appointments list
- **Admin calendar UX**: remove the confusing "No autorizado" toast on cancelled appointment click (detail panel from `#43h` will replace it); add a drag hint in the calendar header for reschedulable appointments

## Capabilities

### New Capabilities
<!-- None — all changes fix existing capabilities -->

### Modified Capabilities
- `service-detail-panel`: requirement changed — ALL service cards trigger the detail panel regardless of `description` presence; services without an image use the pastel placeholder; desktop panel must fill viewport height with internal scroll
- `booking-slot-day-view`: new requirements — first hour label must not be clipped at scroll top; available/selected/disabled slot blocks must meet sufficient color contrast
- `admin-dashboard`: new requirement — stat card titles must not truncate on mobile; use wrapping or `text-sm` so titles render fully at all breakpoints
- `admin-calendar-time-axis`: requirement change — clicking a cancelled or completed appointment block must NOT show an "unauthorized" toast; a non-intrusive drag hint copy must be shown in the calendar header when reschedulable appointments are present in the current view

## Impact

- `src/components/ServiceDetailPanel.tsx` (or equivalent) — trigger condition change + height fix
- `src/components/BookingSlotDayView.tsx` — scroll padding + color token update
- `src/pages/AdminDashboardPage.tsx` — stat card CSS fix
- `src/pages/AdminUsersPage.tsx` (or navigation/tab labels) — copy rename
- `src/lib/formatPrice.ts` — `formatPriceARS` utility already exists; audit all call sites and add missing usages
- `src/pages/AdminCalendarPage.tsx` — remove toast on cancelled click; add drag hint copy
- No backend changes, no migrations, no new RPCs
