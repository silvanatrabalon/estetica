## 1. Install DnD Dependencies

- [x] 1.1 Run `npm install @dnd-kit/core @dnd-kit/modifiers` and verify package.json is updated
- [x] 1.2 Confirm TypeScript types are available (included in `@dnd-kit/core`)

## 2. Timezone-Correct Date Grouping (25a — prerequisite)

- [x] 2.1 Add `toLocalDateKey(isoUtc: string, orgTimezone: string): string` pure function in `src/lib/formatSlotTime.ts` (or a new `src/lib/dateUtils.ts`) that returns `"YYYY-MM-DD"` in the given IANA timezone using `Intl.DateTimeFormat`
- [x] 2.2 Replace `apt.startsAt.slice(0, 10)` in `WeeklyCalendar.tsx` `byDate` grouping with `toLocalDateKey(apt.startsAt, orgTimezone)`
- [x] 2.3 Replace `apt.startsAt.slice(0, 10)` in `MonthlyCalendar.tsx` `byDate` grouping with `toLocalDateKey(apt.startsAt, orgTimezone)` and remove the `_orgTimezone` unused parameter warning
- [x] 2.4 Write unit tests for `toLocalDateKey`: verify appointment at `2026-05-17T01:00:00Z` in `America/Argentina/Buenos_Aires` returns `"2026-05-16"`; verify same appointment in `UTC` returns `"2026-05-17"`

## 3. Slot Picker Modal Component

- [x] 3.1 Create `src/components/appointments/SlotPickerModal.tsx` — modal wrapper (dialog backdrop + close button + title "Elegí un horario") that accepts `serviceId`, `date`, `orgTimezone`, `onConfirm(startsAt: string)`, `onClose()`, `loading`, `error` props
- [x] 3.2 Inside `SlotPickerModal`, call `useAvailableSlots(serviceId, date)` and render the existing `SlotGrid` component with the returned slots
- [x] 3.3 Show Spanish empty state when `useAvailableSlots` returns an empty array: "No hay horarios disponibles para esta fecha. Elegí otro día."
- [x] 3.4 Show Spanish loading state while `useAvailableSlots` is fetching
- [x] 3.5 Show inline Spanish error when `onConfirm` fails (passed as `error` prop from parent): conflict error "El horario seleccionado ya no está disponible. Elegí otro."; policy error "No podés reprogramar con tan poca anticipación."
- [x] 3.6 Write unit tests: modal renders with title; SlotGrid is called with correct props; empty state shown when no slots; close button calls `onClose`; error prop renders Spanish error message

## 4. DnD in WeeklyCalendar (25b)

- [x] 4.1 Wrap `WeeklyCalendar` JSX root in `<DndContext sensors={[...]} onDragEnd={handleDragEnd}>` from `@dnd-kit/core`; configure `PointerSensor` with `activationConstraint: { distance: 8 }` to avoid conflicts with scroll
- [x] 4.2 Make each day column a drop zone using `useDroppable({ id: dateKey })` where `dateKey` is the local date string (e.g., `"2026-05-17"`)
- [x] 4.3 Wrap each `pending`/`confirmed` appointment block with `useDraggable({ id: apt.id, data: { appointment: apt } })`; apply `transform` style from `useDraggable` to the element during drag
- [x] 4.4 `cancelled`, `completed`, `no_show` appointment blocks: do NOT wrap with `useDraggable`; add `cursor-default` class
- [x] 4.5 Implement `handleDragEnd(event: DragEndEvent)` in `WeeklyCalendar`: extract `appointment` from `event.active.data.current`; extract `newDateKey` from `event.over?.id`; if `newDateKey === currentLocalDateKey(appointment)` → no-op; otherwise set state to open `SlotPickerModal` with `{ serviceId: apt.serviceId, date: newDateKey }`
- [x] 4.6 Add `WeeklyCalendarProps` optional callbacks: `onRescheduleSuccess?: (appointmentId: string, newStartsAt: string) => void`; parent page updates appointment list on success
- [x] 4.7 Write unit tests: `handleDragEnd` with same-day drop → no modal state set; `handleDragEnd` with different day drop → modal state is set; cancelled appointment block has no `data-draggable` attribute; drag calls `rescheduleAppointment` with correct args after slot selection

## 5. Availability Overlay in Staff Weekly Calendar (25c)

- [x] 5.1 Create `src/hooks/useStaffScheduleOverlay.ts` — accepts `staffMemberId: string | null` and `weekStart: Date`; fetches `staff_schedules` rows for the staff member (direct SELECT); fetches `staff_schedule_exceptions` for the visible week's date range; returns `{ scheduleByDay: Record<number, StaffScheduleRow | null>, exceptionsByDate: Record<string, StaffScheduleException> }`
- [x] 5.2 Create `src/components/appointments/AvailabilityOverlay.tsx` — renders behind appointment blocks in a day column; accepts `date: string`, `staffSchedule: StaffScheduleRow | null`, `exception: StaffScheduleException | undefined`, `businessClosures: BusinessClosureException[]`; renders working-hours shading (light indigo), non-working shading (neutral gray), "Día libre" label for `day_off`, "Cerrado" label for full-day business closure
- [x] 5.3 Add optional props to `WeeklyCalendar`: `staffScheduleOverlay?: { scheduleByDay: Record<number, StaffScheduleRow | null>, exceptionsByDate: Record<string, StaffScheduleException>, businessClosures: BusinessClosureException[] }` — when provided, render `AvailabilityOverlay` in each day column
- [x] 5.4 In `StaffAppointmentsPage.tsx`: call `useStaffScheduleOverlay(staffMemberId, weekStart)` where `staffMemberId` is derived from the current user's staff member record; pass overlay data to `WeeklyCalendar`
- [x] 5.5 Write unit tests for `AvailabilityOverlay`: working hours render light indigo background; non-working hours render gray; `day_off` exception renders "Día libre" label; `custom_hours` exception uses custom window; business closure renders "Cerrado" label

## 6. Admin Calendar Page (25d)

- [x] 6.1 Create `src/pages/AdminCalendarPage.tsx` — page with `RoleGuard allowedRoles={['admin']}`; maintains `weekStart` state (Monday of current week); calls `adminListAppointments({ dateFrom: weekStart, dateTo: weekEnd }, 1, 50)` on mount and on week navigation
- [x] 6.2 Render `WeeklyCalendar` inside `AdminCalendarPage` with the loaded appointments and DnD enabled; appointment blocks show `customerName + serviceName` (2-line, truncated)
- [x] 6.3 Wire `onRescheduleSuccess` callback in `AdminCalendarPage` to refresh the appointment list after a successful DnD reschedule
- [x] 6.4 Add loading state (spinner + "Cargando turnos..."), empty state ("No hay turnos esta semana."), and error state ("Ocurrió un error al cargar el calendario.") — all in Spanish
- [x] 6.5 Register route `/admin/calendar` in `src/lib/routing.ts` as `role-restricted` for `['admin']`
- [x] 6.6 Register `<Route path="/admin/calendar" element={<AdminCalendarPage />} />` inside the admin `RoleGuard` block in `src/App.tsx`
- [x] 6.7 Export `AdminCalendarPage` from `src/pages/index.ts`
- [x] 6.8 Add "Calendario" nav item to admin section in `src/lib/navigation.ts` after "Turnos" (`/admin/appointments`): `{ id: 'admin-calendar', label: 'Calendario', href: '/admin/calendar', roles: ['admin'] }`
- [x] 6.9 Write unit tests for `AdminCalendarPage`: renders loading state on mount; renders empty state when no appointments returned; renders error state on RPC failure; admin can see appointment blocks with customer name + service name; non-admin access denied (RoleGuard renders unauthorized)

## 7. Responsive Weekly Calendar (25e)

- [x] 7.1 Add `isMobileView: boolean` derived state to `WeeklyCalendar` using a `useWindowWidth()` hook (or `window.matchMedia('(max-width: 767px)')` listener); when `true`, render single-day strip instead of 7-column grid
- [x] 7.2 Single-day strip: show prev/next day arrows (`<` / `>`); display appointment blocks full-width for the current single day; default to today's local date in `orgTimezone` on mount
- [x] 7.3 Monthly calendar navigation arrows: increase touch target to min 44×44px on mobile (add `min-w-11 min-h-11` Tailwind classes to navigation buttons)
- [x] 7.4 Write unit tests for responsive behavior: single-day strip renders only one day's appointments when `isMobileView = true`; next arrow advances by one day; prev arrow goes back one day; today is shown on initial mount

## 8. Wire DnD in AppointmentsPage and StaffAppointmentsPage

- [x] 8.1 In `AppointmentsPage.tsx`: when calendar view is active and `calendarMode === 'semanal'`, pass `onRescheduleSuccess` to `WeeklyCalendar` that calls `setAppointments` to update the in-memory appointment list with the rescheduled `startsAt`/`endsAt`
- [x] 8.2 In `StaffAppointmentsPage.tsx`: same — wire `onRescheduleSuccess` to update appointments in state; also pass `staffScheduleOverlay` data from `useStaffScheduleOverlay` hook (from task 5.4)
- [x] 8.3 Write integration tests for `AppointmentsPage` calendar DnD: customer drops appointment on new day → `SlotPickerModal` opens; customer selects slot → `rescheduleAppointment` is called; success updates appointment in list without page reload

## 9. Tests: Final Pass and Vitest Run

- [x] 9.1 Run `npx vitest run` and confirm all existing tests still pass (no regressions from timezone grouping fix or DnD wiring)
- [x] 9.2 Verify total new test count: target ≥ 25 new tests covering tasks 2.4, 3.6, 4.7, 5.5, 6.9, 7.4, 8.3
- [x] 9.3 Confirm `@dnd-kit/core` DnD interactions are tested with `fireEvent.pointerDown` / `fireEvent.pointerUp` or mock patterns (do NOT use `@testing-library/user-event` — use `fireEvent` per project convention)
