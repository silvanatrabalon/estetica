## ADDED Requirements

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
