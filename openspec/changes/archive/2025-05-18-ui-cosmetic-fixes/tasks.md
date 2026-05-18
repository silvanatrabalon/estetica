# Tasks — ui-cosmetic-fixes

## 1. Service Detail Panel (42a)

- [x] 1.1 In `src/pages/BookingPage.tsx`, locate the condition that guards opening `ServiceDetailPanel` (currently checks for a non-empty `description`). Remove that condition so the panel opens for **all** service cards on tap/click.
- [x] 1.2 In `src/pages/BookingPage.tsx`, inside the `ServiceDetailPanel` inline component, ensure services without `image_url` render a pastel placeholder `div` (e.g. `bg-pink-50` with a centered icon) instead of an empty or broken image element.
- [x] 1.3 In `src/pages/BookingPage.tsx`, inside the `ServiceDetailPanel` inline component, fix the desktop layout container: add `h-screen overflow-y-auto` (or `max-h-screen overflow-y-auto`) to the sticky/fixed side panel wrapper so the panel fills the viewport height and scrolls internally rather than overflowing or collapsing.

## 2. BookingSlotDayView fixes (42b)

- [x] 2.1 In `src/components/booking/BookingSlotDayView.tsx`, add top padding to the `overflow-y-auto max-h-[640px]` scroll container (e.g. `pt-2`) so the first hour label (e.g. "08:00") is not clipped when the component mounts. Apply the same fix to both the loading skeleton branch and the main render branch.
- [x] 2.2 In `src/components/booking/BookingSlotDayView.tsx`, update the unselected available slot block classes from `bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100` to a saturated variant with sufficient contrast, e.g. `bg-teal-500 border-teal-600 text-white hover:bg-teal-600`.
- [x] 2.3 In `src/components/booking/BookingSlotDayView.tsx`, if any past or disabled slot blocks exist (blocks rendered as non-interactive), ensure they use `bg-gray-100 text-gray-400 opacity-50` for clear visual distinction.
- [x] 2.4 In `src/components/booking/BookingSlotDayView.test.tsx`, update or add assertions that verify: (a) the scroll container has a top padding class on mount, and (b) an unselected available slot carries a high-contrast background class (e.g. `bg-teal-500`).

## 3. Admin dashboard stat card (42c)

- [x] 3.1 In `src/components/StatCard.tsx`, change the label element's class from `text-sm font-medium text-gray-500 truncate` to `text-sm font-medium text-gray-500 leading-snug` (remove `truncate`, allow wrapping) so stat card titles never truncate on narrow screens.

## 4. Admin users copy (42d)

- [x] 4.1 In `src/pages/AdminUsersPage.tsx` line 323, rename the label text from `"Altas (30 días)"` to `"Nuevos (30 días)"`.
- [x] 4.2 Scan `src/pages/AdminUsersPage.tsx` for any other occurrences of "Altas" used as a user-registration metric label and update them to "Nuevos" for consistency.

## 5. Price display ARS (42e)

- [x] 5.1 In `src/pages/BookingConfirmationPage.tsx`, add an import for `formatPriceARS` from `../lib/formatPrice`.
- [x] 5.2 In `src/pages/BookingConfirmationPage.tsx` (~line 151), replace the inline formatter `(apt.servicePriceCents / 100).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', ... })` with `formatPriceARS(apt.servicePriceCents)`.
- [x] 5.3 Verify that `src/pages/AdminAppointmentsPage.tsx` does not display a raw price; if it does, add `formatPriceARS` there as well.
- [x] 5.4 Confirm the following files already use `formatPriceARS` and require no changes: `src/pages/AdminServicesPage.tsx`, `src/pages/BookingPage.tsx`, `src/pages/AdminStaffServicesPage.tsx`, `src/pages/LandingPage.tsx`.

## 6. Admin calendar UX (42f)

- [x] 6.1 Search `src/components/appointments/TimeAxisWeeklyCalendar.tsx`, `src/components/appointments/DayView.tsx`, and `src/pages/AdminCalendarPage.tsx` for any guard, `onClick` handler, or error state that fires a toast or error message when a cancelled or completed appointment block is clicked. Remove it if found. (Research indicates no such guard exists in the current codebase — this task is a verification no-op unless found.)
- [x] 6.2 In `src/pages/AdminCalendarPage.tsx` (or in the header section of `src/components/appointments/TimeAxisWeeklyCalendar.tsx`), add a subtle drag hint element: render the text `"Arrastrá un turno para reprogramarlo"` (e.g. as `<p className="text-xs text-gray-400 italic">`) in the calendar header area **only when** at least one appointment in the current view has status `pending` or `confirmed` (i.e. `appointments.some(apt => apt.status === 'pending' || apt.status === 'confirmed')`).
