## 1. Data Layer — OrgTimezone Fix

- [x] 1.1 Verify `admin_list_appointments` SQL includes `org_timezone` in its SELECT; if missing, add `o.timezone as org_timezone` to the query (no migration needed — it's a join already present)
- [x] 1.2 Add `orgTimezone: string` field to `AdminAppointmentRow` interface in `src/services/adminAppointments.ts`
- [x] 1.3 Update the camelCase mapper in `adminAppointments.ts` to map `org_timezone → orgTimezone`
- [x] 1.4 Update `toAppointmentSummary` in `AdminCalendarPage` to use `row.orgTimezone` instead of hardcoded `'UTC'`

## 2. Shared Utility — Time-Axis Positioning

- [x] 2.1 Create `src/lib/timeAxis.ts` with exported pure functions: `getTopPx(startsAt, gridOpenMinutes, pxPerMin)`, `getHeightPx(durationMinutes, pxPerMin, minHeightPx)`, `getGridOpenMinutes(opensAt: string): number`
- [x] 2.2 Add unit tests in `src/lib/timeAxis.test.ts` covering: appointment at exactly open time → `top = 0`; 90-min appointment → `height = 90`; appointment shorter than `MIN_BLOCK_HEIGHT_PX` → height clamped; `getGridOpenMinutes` parses `"HH:MM"` string correctly

## 3. DayView Component

- [x] 3.1 Create `src/components/appointments/DayView.tsx`: accepts `appointments: AppointmentSummary[]`, `orgTimezone: string`, `openTime: string`, `closeTime: string`, `selectedDate: Date` as props
- [x] 3.2 Implement the hour-label column (left side): one label per hour from `openTime` to `closeTime`, formatted in org timezone
- [x] 3.3 Implement appointment blocks: absolutely positioned using `getTopPx` / `getHeightPx`; each block shows customer name + service name (2-line truncated); colored by status (reuse `STATUS_COLORS` from `WeeklyCalendar`)
- [x] 3.4 Wire day navigation: export an `onDayChange` callback prop; `DayView` itself does not own date state (stateless in this regard)
- [x] 3.5 Add loading, empty ("Sin turnos para este día"), and error states via props

## 4. TimeAxisWeeklyCalendar Component

- [x] 4.1 Create `src/components/appointments/TimeAxisWeeklyCalendar.tsx`: 7-column grid with a shared time-label column on the left; accepts same props as `WeeklyCalendar` (`appointments`, `orgTimezone`, `currentDate`, `onWeekChange`, `showCustomerName`, `onRescheduleSuccess`)
- [x] 4.2 Each day column renders appointment blocks using `getTopPx` / `getHeightPx` (same `timeAxis.ts` utilities as `DayView`)
- [x] 4.3 Preserve drag-and-drop reschedule behavior from `WeeklyCalendar`: wrap `TimeAxisWeeklyCalendar` with `DndContext`, make blocks draggable, open `SlotPickerModal` on drop to different day
- [x] 4.4 Preserve empty-state rendering per day column (no blocks = empty space, no separate message needed in weekly view)

## 5. AdminCalendarPage — View Mode Toggle + Day View Integration

- [x] 5.1 Add `view: 'day' | 'week'` state to `AdminCalendarPage` (default: `'week'`)
- [x] 5.2 Add `selectedDate: Date` state (default: today) used by the day view
- [x] 5.3 Add view-mode toggle UI: "Día" / "Semana" button group (consistent with existing toggle style in the app)
- [x] 5.4 Fetch business hours on mount using `getBusinessSettings()` and derive `openTime`/`closeTime` for the day view grid; store as state; fall back to `'08:00'`/`'20:00'` if no row for weekday
- [x] 5.5 In day view mode: render `DayView` with prev/next day arrows and "Hoy" button; pass `selectedDate`, `orgTimezone`, `openTime`, `closeTime`, and the day's filtered appointments
- [x] 5.6 In week view mode: render `TimeAxisWeeklyCalendar` (replacing the current `WeeklyCalendar`)
- [x] 5.7 Day view data fetch: when `view === 'day'`, set `dateFrom`/`dateTo` to cover only `selectedDate` (midnight to 23:59:59 in org timezone)

## 6. Tests

- [x] 6.1 Unit tests for `DayView`: block at open time → `top = 0`; block height proportional to duration; appointment spanning close time still renders; empty state renders "Sin turnos para este día"
- [x] 6.2 Unit tests for `TimeAxisWeeklyCalendar`: appointments grouped correctly by local date key; block heights correct; DnD drop on different day opens `SlotPickerModal`; drop on same day is no-op
- [x] 6.3 Integration test for `AdminCalendarPage`: view toggle switches between Día and Semana; "Hoy" button resets day view to today; prev/next arrows change selected date; org timezone resolved from first appointment row
- [x] 6.4 Verify existing `WeeklyCalendar` tests still pass (no regression — component is unchanged)

## 7. Fix: overlapping appointments rendered side by side

- [x] 7.1 Agregar función `computeColumnLayout(apts: AppointmentSummary[]): ColumnLayout[]` en `TimeAxisWeeklyCalendar.tsx`: algoritmo greedy first-fit que asigna a cada turno un `colIndex` y `totalCols` de forma que turnos que se solapan ocupen columnas adyacentes en lugar de superponerse
- [x] 7.2 Actualizar `DraggableTimeBlock` y `StaticTimeBlock` para aceptar `colIndex` y `totalCols`; calcular `left` y `width` como porcentajes (`colWidth = 100 / totalCols`) en lugar de valores fijos `left: 2, right: 2`
- [x] 7.3 Reemplazar `dayAppointments.map(...)` por `computeColumnLayout(dayAppointments).map(...)` en el render de cada columna día
