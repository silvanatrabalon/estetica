## MODIFIED Requirements

### Requirement: BookingPage Step 3 shows available slots for the selected date
The system SHALL render Step 3 of the booking wizard using `BookingSlotDayView` instead of a flat button grid. Step 3 SHALL display a date summary label ("Turnos disponibles para {fecha formateada}") above the `BookingSlotDayView`. A "Siguiente" CTA SHALL appear below the view and SHALL be disabled until a slot is selected. The `BookingSlotDayView` SHALL receive `slots`, `selectedSlot`, `onSelectSlot`, `orgTimezone`, `openTime` (from org business hours earliest open time), and `closeTime` (from org business hours latest close time) as props. The grid SHALL fall back to `openTime = "08:00"` and `closeTime = "20:00"` if business settings have not yet resolved. The previous `grid grid-cols-3` button implementation MUST be removed.

#### Scenario: Step 3 renders BookingSlotDayView with available slots
- **WHEN** `step === 3`, `selectedService` and `selectedDate` are set, and `useAvailableSlots` resolves slots
- **THEN** `BookingSlotDayView` is rendered with the resolved `slots`, `orgTimezone`, `openTime`, and `closeTime`

#### Scenario: "Siguiente" is disabled with no slot selected
- **WHEN** `step === 3` and `selectedSlot` is `null`
- **THEN** the "Siguiente" button is disabled (cannot be clicked to advance to Step 4)

#### Scenario: "Siguiente" is enabled after slot selection
- **WHEN** the user selects a slot via `BookingSlotDayView`
- **THEN** `selectedSlot` is set and the "Siguiente" button becomes enabled

#### Scenario: Clicking "Siguiente" with a slot selected advances to Step 4
- **WHEN** `selectedSlot` is set and the user clicks "Siguiente"
- **THEN** `step` transitions to 4 and Step 4 renders with the selected slot

#### Scenario: Loading state is passed to BookingSlotDayView
- **WHEN** `useAvailableSlots` is loading
- **THEN** `BookingSlotDayView` receives `loading=true` and renders its skeleton

#### Scenario: Error from useAvailableSlots is shown in Spanish
- **WHEN** `useAvailableSlots` returns an error
- **THEN** the Spanish error message is displayed (not the BookingSlotDayView)
