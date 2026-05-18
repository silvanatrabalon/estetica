## 1. Extract `deriveGridTimes` to shared lib

- [x] 1.1 Create `src/lib/businessHours.ts` with the `deriveGridTimes(weeklyHours, fallbackOpen?, fallbackClose?)` helper extracted from `AdminCalendarPage.tsx`
- [x] 1.2 Update `AdminCalendarPage.tsx` to import `deriveGridTimes` from `src/lib/businessHours.ts` (remove the inline function)
- [x] 1.3 Export `deriveGridTimes` from `src/lib/index.ts`

## 2. Add `orgOpenTime`/`orgCloseTime` state to `BookingPage`

- [x] 2.1 Add `orgOpenTime` (`useState('08:00')`) and `orgCloseTime` (`useState('20:00')`) state to `BookingPage.tsx`
- [x] 2.2 In the existing `getBusinessSettings()` call inside the mount effect, call `deriveGridTimes(settings.weeklyHours)` and set `orgOpenTime`/`orgCloseTime` from the result

## 3. Implement `BookingSlotDayView` component

- [x] 3.1 Create `src/components/booking/BookingSlotDayView.tsx` with props: `slots: AvailableSlot[]`, `selectedSlot: AvailableSlot | null`, `onSelectSlot: (slot: AvailableSlot) => void`, `orgTimezone: string`, `openTime: string`, `closeTime: string`, `loading?: boolean`
- [x] 3.2 Implement the scrollable time-axis grid container (`overflow-y-auto max-h-[640px]`) with correct `height = getGridHeightPx(openTime, closeTime)`
- [x] 3.3 Render hour labels in a left column (same pattern as `DayView`) using `PX_PER_MIN` from `src/lib/timeAxis.ts`
- [x] 3.4 Render each available slot as an absolutely-positioned `<button>` block using `getTopPx` for `top` and `getHeightPx(durationMinutes)` for `height`; duration derived from `ends_at - starts_at`
- [x] 3.5 Apply selected-slot styling (brand-color background + border) when `slot.starts_at === selectedSlot?.starts_at`; apply unselected available-slot styling (teal/green variant) for all other slots
- [x] 3.6 Show start time (`formatSlotTime`) and duration in minutes inside each slot block
- [x] 3.7 Render loading skeleton (pulsing placeholder at `gridHeightPx` height) when `loading=true`; hide slot blocks and empty state
- [x] 3.8 Render Spanish empty state "No hay turnos disponibles para este día" centered within the grid when `slots.length === 0` and `loading=false`
- [x] 3.9 Export `BookingSlotDayView` from `src/components/booking/index.ts` (create `index.ts` if it doesn't exist)

## 4. Update `BookingPage` Step 3

- [x] 4.1 Replace the `<div className="grid grid-cols-3 gap-2">` slot button grid (and its surrounding loading/error/empty inline states) with `<BookingSlotDayView slots={slots} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} orgTimezone={orgTimezone} openTime={orgOpenTime} closeTime={orgCloseTime} loading={slotsLoading} />`
- [x] 4.2 Keep the existing `slotsError` rendering above `BookingSlotDayView` (error state is still shown inline; `BookingSlotDayView` is only rendered when there is no error)
- [x] 4.3 Add a "Siguiente" `<button>` below `BookingSlotDayView` that is `disabled` when `selectedSlot === null`; clicking it calls `setStep(4)`
- [x] 4.4 Update the date summary label to read "Turnos disponibles para {fecha formateada}" using `selectedDate` formatted in `orgTimezone`
- [x] 4.5 Remove the now-unused `handleSlotSelect` step-advance logic (slot selection no longer directly advances step; the "Siguiente" button does)

## 5. Unit tests — `BookingSlotDayView`

- [x] 5.1 Create `src/components/booking/BookingSlotDayView.test.tsx`
- [x] 5.2 Test: slot blocks render with correct `top` and `height` styles for given `starts_at`/`ends_at` values
- [x] 5.3 Test: selected slot block has the selected style class; unselected blocks do not
- [x] 5.4 Test: clicking a slot block calls `onSelectSlot` with the correct `AvailableSlot`
- [x] 5.5 Test: empty state "No hay turnos disponibles para este día" renders when `slots=[]` and `loading=false`
- [x] 5.6 Test: loading skeleton renders when `loading=true`; slot blocks and empty state are not rendered
- [x] 5.7 Test: hour labels are rendered for each whole-hour boundary between `openTime` and `closeTime`

## 6. Integration tests — `BookingPage` Step 3

- [x] 6.1 Update `BookingPage` tests (or add to `BookingPage.test.tsx`): Step 3 renders `BookingSlotDayView` when `step === 3`
- [x] 6.2 Test: "Siguiente" button is disabled when no slot is selected in Step 3
- [x] 6.3 Test: clicking a slot sets `selectedSlot` and enables "Siguiente"
- [x] 6.4 Test: clicking "Siguiente" with a slot selected transitions to Step 4

## 7. Verify all tests pass

- [x] 7.1 Run `npx vitest run` and confirm all tests pass (no regressions)
