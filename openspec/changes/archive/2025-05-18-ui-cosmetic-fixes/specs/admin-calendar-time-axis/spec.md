## ADDED Requirements

### Requirement: Clicking a cancelled or completed appointment does not show an error toast
When an admin clicks a cancelled or completed appointment block in the admin calendar, the system SHALL NOT display an "unauthorized" or any other error toast. Until the appointment detail panel (item 43h) is implemented, the click is a silent no-op for these statuses.

#### Scenario: Clicking a cancelled appointment block shows no error toast
- **WHEN** an admin clicks an appointment block with status `cancelled` in the admin calendar
- **THEN** no toast, alert, or error message is displayed

#### Scenario: Clicking a completed appointment block shows no error toast
- **WHEN** an admin clicks an appointment block with status `completed` in the admin calendar
- **THEN** no toast, alert, or error message is displayed

### Requirement: Admin calendar shows a drag hint when reschedulable appointments are present
The admin calendar SHALL display a non-intrusive drag hint in the calendar header area when there are one or more `pending` or `confirmed` appointments visible in the current view. The hint copy SHALL be `"Arrastrá un turno para reprogramarlo"`. The hint MUST NOT be shown when there are no reschedulable appointments in the current view.

#### Scenario: Drag hint visible when reschedulable appointments exist
- **WHEN** the current calendar view contains at least one appointment with status `pending` or `confirmed`
- **THEN** the drag hint `"Arrastrá un turno para reprogramarlo"` is displayed in the calendar header area

#### Scenario: Drag hint hidden when no reschedulable appointments exist
- **WHEN** the current calendar view contains no appointments with status `pending` or `confirmed` (only cancelled, completed, or no appointments)
- **THEN** the drag hint is not rendered
