## Context

The booking system has working weekly and monthly calendar views (`WeeklyCalendar`, `MonthlyCalendar`) used in `AppointmentsPage` (customer) and `StaffAppointmentsPage` (staff), both implemented in #20. These calendars are read-only — appointment cards link to the confirmation page but cannot be rescheduled by dragging. There is no admin calendar view; admins interact with appointments through a paginated table (`AdminAppointmentsPage`, #23).

Two correctness issues exist before adding interactivity:
1. Both calendars group appointments using `apt.startsAt.slice(0, 10)` — the raw UTC date. In `America/Argentina/Buenos_Aires` (UTC-3), an appointment at `01:00 UTC` is `22:00` the prior day locally, but the calendar shows it on the UTC date. This is a UX bug that DnD makes worse (drop targets are days, so wrong day grouping = wrong drop zone).
2. `MonthlyCalendar` accepts `orgTimezone` as a prop but does not use it — it was accepted for future use.

The reschedule infrastructure is fully in place: `reschedule_appointment` RPC (#21), `getAvailableSlots` service (#16), `SlotGrid` component (#16e), `formatSlotTime` utility (#16c). No new backend work is required.

There is no drag-and-drop library in the project. `@dnd-kit/core` is the appropriate choice — it is actively maintained, accessible by default (keyboard DnD), and composable without opinions about rendering.

## Goals / Non-Goals

**Goals:**
- Fix UTC date grouping bug in both calendar components (timezone-aware local date)
- Add drag-and-drop reschedule to the weekly calendar for all roles (customer, staff, admin)
- Add staff working-hours availability overlay to the staff weekly calendar
- Add `/admin/calendar` route with weekly calendar + admin DnD reschedule
- Make the weekly calendar responsive (single-day strip on mobile)

**Non-Goals:**
- Daily time-axis view (Google Calendar style) — post-MVP
- Availability overlay in customer or admin calendar
- Real-time calendar updates (Supabase Realtime)
- iCal / Google Calendar export
- Batch drag or undo drag
- New database tables or SECURITY DEFINER RPCs

## Decisions

### D1: DnD library — `@dnd-kit/core` over `react-beautiful-dnd`

`react-beautiful-dnd` is deprecated and no longer actively maintained. `@dnd-kit/core` is the current community standard: it is accessible (keyboard support out of the box), composable (no forced list/grid abstractions), tree-shakable, and has zero implicit dependencies on DOM structure. It integrates cleanly with React state — sensors detect pointer/keyboard input and call `onDragEnd` with source/destination info. We wrap `WeeklyCalendar` in a `DndContext` and make each day column a `useDroppable` target; each draggable appointment block uses `useDraggable`.

### D2: DnD granularity — day-level, not time-level

Dragging to an exact time slot on a 7-column grid without a time axis is impractical. Instead, dropping on a day column triggers a slot picker modal. This separates "choose a day" (via drag) from "choose a time" (via modal), keeping the weekly grid clean while preserving slot-level accuracy. The modal calls `getAvailableSlots(serviceId, newDate)` and reuses the existing `SlotGrid` component — no new UI component needed beyond a modal wrapper.

### D3: Slot picker modal wraps existing `SlotGrid`

`SlotGrid` from `BookingPage` (#16e) already renders available slots, handles loading/empty/error states in Spanish, and formats times with `formatSlotTime`. A thin `SlotPickerModal` component wraps it with a dialog backdrop, title ("Elegí un horario"), close button, and confirmation action. This avoids duplicating slot rendering logic.

### D4: Availability overlay via direct `staff_schedules` SELECT

The overlay needs: the staff member's `staff_member_id`, their 7-day weekly schedule rows, their exception dates in the visible week, and the organization's business closure exceptions. All of this is available via direct authenticated SELECT — `staff_schedules` and `staff_schedule_exceptions` have `authenticated` SELECT policies from #12; `getBusinessSettings()` is already called on mount in `StaffAppointmentsPage`. No new RPC is needed. A new `useStaffScheduleOverlay(staffMemberId, weekStart)` hook will encapsulate the queries and compute per-day working windows.

### D5: Admin calendar data via `adminListAppointments()` with date range

The existing `adminListAppointments(filters, page, pageSize)` service function accepts `dateFrom`/`dateTo` filters. For a weekly view, we pass Monday 00:00 UTC and Sunday 23:59 UTC of the visible week. The default page size of 50 is sufficient for a week (a busy week rarely exceeds 50 appointments). No new RPC or endpoint is needed.

### D6: Responsive strategy — single-day strip on mobile, not compressed 7-column

Compressing a 7-column grid to mobile widths produces ~40px columns that are unusable. The better approach is a breakpoint switch: at `< md`, the weekly calendar renders a single day column with prev/next day arrows (same data, different layout). Today is shown on mount. This is implemented with a `isMobileView` flag from a `useWindowWidth` hook or a CSS approach using Tailwind's responsive prefixes with a render branch.

### D7: Non-draggable statuses — no drag handle, not disabled

`cancelled`, `completed`, and `no_show` appointments render without a drag handle element. This communicates non-draggability visually (no grab cursor) without disabling the component in a way that could confuse screen readers. The `useDraggable` hook is simply not applied to these appointment blocks.

### D8: Same-day drop is a no-op

If a user drops an appointment onto the same day it already occupies, no modal opens and no RPC is called. Detected by comparing the appointment's local calendar date (derived from `orgTimezone`) with the drop target's date.

## Risks / Trade-offs

**[Risk] DnD on mobile touch is impractical** → Mitigation: On `< md`, the weekly calendar renders as a single-day strip; there are no day-column drop targets on mobile. DnD is effectively desktop-only. Mobile users use the "Reprogramar" button on the appointment card (existing flow from #21). The `@dnd-kit/core` `PointerSensor` requires a small drag distance threshold to avoid triggering on scroll, which is configured via `activationConstraint: { distance: 8 }`.

**[Risk] Slot picker modal has no slots** → Mitigation: If `getAvailableSlots` returns an empty array, the modal shows an empty state in Spanish ("No hay horarios disponibles para esta fecha. Elegí otro día.") with a close button. The user can drag to a different day.

**[Risk] Availability overlay fetches on every week navigation** → Mitigation: `useStaffScheduleOverlay` fetches `staff_schedules` once (weekly template doesn't change often) and fetches `staff_schedule_exceptions` for the visible date range on each week change. This is at most 2 queries per navigation. Acceptable for MVP; memoization can be added later.

**[Risk] Admin calendar with many appointments** → Mitigation: A typical business week has far fewer than 50 appointments. The 50-item cap from `adminListAppointments` is sufficient. If volume grows, a cursor-based approach can be added post-MVP.

**[Risk] `SlotGrid` expects a step callback, not a direct selection** → Mitigation: `SlotGrid` already emits `onSelectSlot(slot)`. `SlotPickerModal` wraps it and calls `rescheduleAppointment` on selection, then closes the modal. The modal manages its own loading/error state for the reschedule call.

## Migration Plan

No database migrations required. No breaking changes to existing pages — `AppointmentsPage` and `StaffAppointmentsPage` are enhanced in-place. The timezone grouping fix is the only behavioral change visible to users (appointments appear on the correct local day), but this is a correctness improvement.

Deploy order:
1. Install `@dnd-kit/core` + `@dnd-kit/modifiers`
2. Deploy frontend with all changes (single Vercel deployment)
3. No migration, no RPC changes, no rollback complexity

## Open Questions

None — all decisions are resolved as documented above.
