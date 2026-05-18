## Context

The application has accumulated minor UX debt across the booking wizard, admin panels, and mobile views. This change batch-addresses 16 interaction and ergonomic improvements (43a–43p) that are either purely frontend or require only minimal backend changes. The primary backend coordination required is a `DROP FUNCTION + CREATE` migration for `get_appointment()` to add `customer_name` (43h). One sub-item (43f) is blocked on a separate backend change (#44d).

## Goals / Non-Goals

**Goals:**
- Fix booking wizard navigation ergonomics (fixed back + CTA)
- Remove confusing/empty UI elements (staff clients tab, no-show filter, quick-access widget, today's widget)
- Make admin panels usable on mobile (staff table → list, services table → cards, service availability checkboxes → dropdown)
- Upgrade low-ergonomics form inputs to appropriate controls (hex → color picker, minutes → segmented duration, day checkboxes → select)
- Surface appointment detail on calendar click
- Add contextual help copy where user intent is ambiguous

**Non-Goals:**
- 43f (date-range analytics) is included in specs/tasks but implementation is gated on the #44d RPC migration — tasks will be marked as blocked
- "Eliminar usuario" hard-delete (moved to #44e, requires Edge Function)
- Any new features not explicitly listed in 43a–43p
- Visual redesign or theming changes beyond the specified inputs

## Decisions

### D1 — Fixed booking wizard navigation via CSS `position: fixed`
The back button (top-left) and CTA (bottom-right desktop / bottom full-width mobile) are rendered as `position: fixed` overlays in `BookingPage.tsx`. The scrollable step content receives top/bottom padding to prevent overlap. This is the simplest approach that requires no layout restructuring and works with the existing step-rendering pattern.

**Alternative considered**: Sticky header/footer layout wrapper — rejected because it would require restructuring the existing step component hierarchy and adding a new layout abstraction for one page.

### D2 — `get_appointment()` RPC: DROP FUNCTION + CREATE migration (43h)
Adding `customer_name` to the return type of `get_appointment()` requires a breaking SQL migration. The current callers (`BookingConfirmationPage`, `ReschedulePage`) only read `customer_user_id` from the result and will not break if `customer_name` is added as an extra column — PostgreSQL allows callers to ignore new columns, and the TypeScript service layer maps response fields explicitly. The migration is safe to deploy with zero downtime if callers are updated in the same release.

**Risk**: If any TypeScript caller destructures the entire RPC response without type-checking, adding a new field is additive and safe. The `RETURNS TABLE` type change is the risky part: the old function signature must be dropped before the new one is created — the migration file must contain `DROP FUNCTION get_appointment(...)` followed by the new `CREATE OR REPLACE FUNCTION`. This must be reviewed against the exact existing signature.

### D3 — Native `<input type="color">` for color pickers (43g, 43p)
Use the browser-native color picker control for `primary_color`, `secondary_color`, and business accent color. No external color picker library is introduced. The native picker has sufficient cross-browser support (all modern browsers) for this use case. The hex value from the input is stored as-is in the database.

**Alternative considered**: React color picker library (e.g., react-colorful) — rejected as overkill for two inputs; adds bundle weight and a dependency for no material gain in MVP.

### D4 — Segmented duration input (43i, 43m) implemented as local state decomposition
For `booking_min_notice_minutes` and `duration_minutes`, a local component maintains separate `days`, `hours`, `minutes` integer fields. On save, they are multiplied and summed to a single integer before the RPC call. On load, the stored minutes value is decomposed back into days/hours/minutes. This is a pure display-layer concern with no backend change.

### D5 — Admin staff mobile list: accordion pattern inline (43k)
On `< md`, the staff table is replaced with a flat list of name buttons. Tapping a name toggles an inline panel below it (accordion). No new component is introduced — state is managed with a `selectedStaffId` local state variable. The FAB button uses Tailwind `fixed bottom-6 right-6` and is conditionally rendered based on `useMediaQuery` (or a Tailwind-only approach using `md:hidden` / `block md:hidden`).

**Alternative considered**: Sheet/drawer component — rejected to avoid introducing a new component for a single use case.

### D6 — 43f (date-range analytics) scaffolded but gated
The `AdminDashboardPage.tsx` changes for 43f (UI wiring for `admin_get_stats_by_range`) are implemented in tasks but the task is marked with a dependency note requiring #44d to be merged first. The UI can be built with a stub service call that throws an error, to be replaced once the RPC exists.

## Risks / Trade-offs

- **`get_appointment()` migration coordination** → Migration must be applied before the new `AdminCalendarPage` detail panel code is deployed. If deployed out of order, the detail panel will receive a response without `customer_name` and show an empty field. Mitigation: bundle the migration and frontend change in the same deployment; the detail panel gracefully falls back to "—" if `customer_name` is null.

- **43f dependency on #44d** → If #44d is delayed, 43f tasks are blocked. Mitigation: the task is scoped so the analytics section renders a placeholder/disabled state when the RPC is unavailable, avoiding a runtime error.

- **Fixed booking wizard navigation + keyboard/accessibility** → Fixed `position: fixed` elements can interfere with focus management on mobile. Mitigation: back button uses a standard `<button>` or `<a>` element with accessible labels; ensure z-index does not trap focus.

- **Native `<input type="color">` UX on iOS Safari** → The native color picker UI on iOS is functional but visually different from desktop. This is acceptable for admin-only usage (not customer-facing).

## Migration Plan

1. Deploy `get_appointment()` RPC migration (drop + recreate with `customer_name`) as a standalone migration
2. Deploy all frontend changes in a single release — the migration and frontend are decoupled enough to release together
3. 43f tasks are implemented last, after #44d RPC is confirmed merged
4. No rollback complexity — all frontend changes are additive or removal-only; removing the no-show chip does not break existing data

## Open Questions

- **43h**: What is the exact current signature of `get_appointment()` (parameter names and types)? Required to write the exact `DROP FUNCTION` statement. Must be verified against the latest migration file before writing 43h's migration task.
- **43f**: Confirm #44d timeline — if it ships before this change, 43f can be implemented immediately; otherwise it will be a follow-up task.
- **43c**: Is `/staff/clients` a route with a full page (`StaffClientsPage.tsx`) or just a navigation entry? The route/nav entry should both be removed or redirected.
