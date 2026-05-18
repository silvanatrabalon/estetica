## ADDED Requirements

### Requirement: Admin calendar appointment blocks open a detail panel on click
Clicking any appointment block in `/admin/calendar` SHALL open a detail sheet or modal displaying: customer name, service name, staff name, date and time, duration, and a status badge. Cancelled and completed appointments SHALL render the detail in read-only mode with no action buttons. Pending and confirmed appointments SHALL show action buttons: "Reprogramar" (opens the slot picker) and "Cancelar". This requires `get_appointment()` to return `customer_name` (via JOIN to `profiles.full_name`) — the RPC MUST be updated via a DROP FUNCTION + CREATE migration before this feature is deployed.

#### Scenario: Clicking a pending or confirmed block opens detail with actions
- **WHEN** the admin clicks a `pending` or `confirmed` appointment block
- **THEN** a detail panel opens showing customer name, service, staff, date/time, duration, status badge, and "Reprogramar" + "Cancelar" action buttons

#### Scenario: Clicking a cancelled or completed block opens read-only detail
- **WHEN** the admin clicks a `cancelled` or `completed` appointment block
- **THEN** a detail panel opens in read-only mode with no action buttons

#### Scenario: Detail panel shows correct customer name
- **WHEN** the detail panel opens
- **THEN** the customer name is populated from `profiles.full_name` (not just the user ID)

#### Scenario: "Reprogramar" opens slot picker
- **WHEN** the admin clicks "Reprogramar" in the detail panel
- **THEN** the slot picker modal opens for the appointment's service and a new date selection

#### Scenario: "Cancelar" confirms and cancels appointment
- **WHEN** the admin clicks "Cancelar" in the detail panel
- **THEN** a confirmation is requested before the appointment status is updated to `cancelled`

#### Scenario: No error toast on cancelled appointment click
- **WHEN** the admin clicks a cancelled appointment block
- **THEN** no error toast or "No autorizado" message is shown; the read-only detail panel opens instead
