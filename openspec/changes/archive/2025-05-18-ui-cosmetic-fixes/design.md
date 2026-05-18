## Context

This change addresses visual bugs and copy inconsistencies accumulated across the booking wizard, admin dashboard, and admin panels. All fixes are frontend-only: no new RPCs, no migrations, no new npm dependencies. The change touches 4–6 component files and one utility audit.

Current state:
- Service detail panel skips entirely for services without a description, leaving an inconsistent tap experience
- `BookingSlotDayView` clips the first hour label and has low color contrast between slot states
- Admin dashboard stat card labels truncate on mobile
- `AdminUsersPage` uses the label "Altas" (an internal HR term) instead of "Nuevos"
- Price values throughout the app display raw `price_cents` (centavos) instead of formatted ARS — `formatPriceARS` in `src/lib/formatPrice.ts` already exists but is not used in all required call sites
- `AdminCalendarPage` shows a confusing "No autorizado" toast when a cancelled appointment is clicked

## Goals / Non-Goals

**Goals:**
- All service cards trigger the detail panel on tap (consistent UX regardless of description/image)
- First hour label is fully visible on mount in `BookingSlotDayView`; slot color contrast is sufficient
- Stat card titles render fully at all mobile viewport widths
- "Altas" → "Nuevos" copy updated in all locations within `/admin/users`
- All price values displayed as ARS currency using `formatPriceARS` (no new utility needed)
- "No autorizado" toast removed on cancelled appointment click; drag hint copy added to calendar header

**Non-Goals:**
- The appointment detail panel (which replaces the removed toast) — that is item 43h, a separate change
- Any backend changes, new RPCs, or migrations
- New npm dependencies

## Decisions

### 1. Service detail panel: always open

**Decision:** Remove the condition that checks for `description` presence before opening the panel. The panel triggers for any card tap.

**Rationale:** The inconsistency (some cards open a panel, others immediately select) is confusing. A uniform tap target is better UX. Services without an image already have a pastel placeholder defined in the `booking-experience-service-catalog` change — reuse the same placeholder logic.

**Alternative considered:** Keep the conditional and only fix the image placeholder. Rejected — the core issue is the inconsistent behavior, not just the missing image.

### 2. Price formatting: audit `formatPriceARS` call sites

**Decision:** `formatPriceARS` in `src/lib/formatPrice.ts` already implements the correct ARS formatting. No new utility is needed. The task is an audit of all price display locations and adding the missing calls.

**Rationale:** Introducing a second formatting function or a global price context would add unnecessary complexity. The existing utility is the right tool.

### 3. `BookingSlotDayView` first label clip: CSS padding

**Decision:** Add a `paddingTop` to the scrollable grid container (or a `scroll-padding-top`) so the topmost hour label is not cut off by the scroll container's edge on mount.

**Rationale:** The label is clipped because the container starts at exactly the top of the first label's baseline. A small top padding (e.g., `pt-2` or `pt-4`) solves this without affecting the pixel-math for slot positions (which is applied relative to the grid's content area).

### 4. Slot color contrast: Tailwind class update

**Decision:** Update the Tailwind classes used for available, selected, and disabled/past slot blocks to achieve sufficient contrast. Available slots: a saturated teal (`bg-teal-500 text-white`); disabled/past slots: `bg-gray-100 text-gray-400 opacity-50`; selected: existing brand color.

**Rationale:** The current teal/green values are too similar between states, making it hard to distinguish available from unavailable. No new design tokens are introduced.

### 5. Toast removal: conditional guard removal

**Decision:** Locate the code in `AdminCalendarPage` that fires the "No autorizado" toast when a cancelled/completed appointment block is clicked, and remove that guard. Until 43h is shipped, clicking a cancelled appointment is a no-op (no toast, no panel).

**Rationale:** An error toast for an authorized action is strictly worse than silence. The detail panel from 43h will fill the gap when implemented.

## Risks / Trade-offs

- **Service detail panel always-open**: Some services may have no description and no image. The panel will render with only name, price, and duration. The pastel placeholder fills the image slot — this is acceptable and a step toward the richer service catalog UX.
- **Toast removal gap**: Between this change and 43h, clicking a cancelled appointment does nothing (no feedback). This is a temporary UX gap, but silence is better than a confusing error message.
- **Price formatting audit scope**: If a call site is missed, it will still show centavos. The task must enumerate all price display locations explicitly.
