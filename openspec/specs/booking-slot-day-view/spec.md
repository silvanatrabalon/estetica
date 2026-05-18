### Requirement: BookingSlotDayView renders available slots on a time axis
The system SHALL provide a `BookingSlotDayView` component that renders `AvailableSlot[]` as absolutely-positioned button blocks on a scrollable time-axis grid. The grid range SHALL be defined by `openTime` and `closeTime` props (HH:MM). The component SHALL use `getTopPx`, `getHeightPx`, and `getGridHeightPx` from `src/lib/timeAxis.ts` to position and size each slot block. Hour labels SHALL appear on the left column at each whole-hour boundary. The selected slot SHALL render with a distinct visual state (brand color background and border). Unselected slots SHALL render with an available-slot style (teal/green variant).

#### Scenario: Slot blocks are positioned by start time
- **WHEN** `BookingSlotDayView` receives a list of `AvailableSlot[]` with different `starts_at` values
- **THEN** each block's `top` style equals `getTopPx(slot.starts_at, gridOpenMinutes, orgTimezone)` and blocks appear at the correct vertical position

#### Scenario: Slot block height reflects duration
- **WHEN** a slot spans N minutes (derived from `ends_at - starts_at`)
- **THEN** the block's `height` style equals `getHeightPx(N)` (subject to `MIN_BLOCK_HEIGHT_PX` floor)

#### Scenario: Selected slot has distinct styling
- **WHEN** `selectedSlot.starts_at` matches a rendered slot
- **THEN** that block renders with the selected style class (brand color background and border)

#### Scenario: Clicking an unselected slot calls onSelectSlot
- **WHEN** the user clicks an unselected slot block
- **THEN** `onSelectSlot(slot)` is called with the matching `AvailableSlot`

#### Scenario: Hour labels appear at each whole-hour boundary
- **WHEN** `openTime = "09:00"` and `closeTime = "13:00"`
- **THEN** labels "09:00", "10:00", "11:00", "12:00" appear in the hour-label column

### Requirement: BookingSlotDayView shows empty state when no slots are available
The system SHALL render a Spanish empty-state message "No hay turnos disponibles para este día" centered within the grid area when `slots` is an empty array and `loading` is false.

#### Scenario: Empty slots renders empty state
- **WHEN** `slots=[]` and `loading=false`
- **THEN** "No hay turnos disponibles para este día" is displayed

#### Scenario: Empty state is not rendered while loading
- **WHEN** `loading=true`
- **THEN** the empty state message is NOT rendered

### Requirement: BookingSlotDayView shows a loading skeleton
The system SHALL render a loading skeleton (pulsing placeholder elements at grid height) when `loading=true`, instead of slot blocks or the empty state.

#### Scenario: Loading state renders skeleton
- **WHEN** `loading=true`
- **THEN** a skeleton element at `gridHeightPx` is rendered and slot blocks are NOT rendered

#### Scenario: Skeleton is not rendered when loaded
- **WHEN** `loading=false` and slots are present
- **THEN** the skeleton is NOT rendered

### Requirement: BookingSlotDayView first hour label is fully visible on mount
The `BookingSlotDayView` component SHALL ensure that the first hour label (e.g., "08:00") is fully visible without clipping when the component mounts. The scrollable grid container MUST include sufficient top padding so the label's full text is not cut off at the top edge of the scroll viewport.

#### Scenario: First hour label visible on mount
- **WHEN** `BookingSlotDayView` mounts and `openTime` is e.g. "08:00"
- **THEN** the "08:00" label is fully visible without vertical clipping at the top of the scroll container

#### Scenario: Top padding does not affect slot block positioning
- **WHEN** top padding is applied to the grid container
- **THEN** slot block `top` values computed from `getTopPx` remain correct relative to the inner grid content area

### Requirement: BookingSlotDayView slot states have sufficient color contrast
The `BookingSlotDayView` component SHALL render available, selected, and disabled/past slot blocks with visually distinct styles that provide sufficient color contrast between states. Available slots SHALL use a saturated teal background with white text. Disabled or past slots SHALL use a muted gray background with reduced opacity. Selected slots SHALL use the brand color (accent) background and border.

#### Scenario: Available slot is visually distinct
- **WHEN** a slot is available and not selected
- **THEN** it renders with a saturated teal background and white text (not a low-contrast variant)

#### Scenario: Disabled or past slot is visually muted
- **WHEN** a slot is in the past or otherwise unavailable
- **THEN** it renders with a muted gray background and reduced opacity, clearly distinguishable from available slots

#### Scenario: Selected slot uses brand accent styling
- **WHEN** `selectedSlot.starts_at` matches a rendered slot
- **THEN** that block renders with the brand color background and border, distinct from both available and disabled states
