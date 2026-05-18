## ADDED Requirements

### Requirement: admin_delete_all_appointments RPC
The system SHALL expose an `admin_delete_all_appointments()` SECURITY DEFINER PostgreSQL function accessible only to authenticated users with the `admin` role. It MUST delete all rows from `appointments` where `organization_id` matches the singleton org. It SHALL return the count of deleted rows as an integer. It MUST NOT apply any status filter — all appointments regardless of status are deleted.

#### Scenario: Admin calls RPC
- **WHEN** an authenticated admin calls `admin_delete_all_appointments()`
- **THEN** all appointment rows for the org are deleted and the function returns the deleted row count

#### Scenario: Non-admin calls RPC
- **WHEN** an authenticated non-admin user calls `admin_delete_all_appointments()`
- **THEN** the function raises a permission error and no rows are deleted

#### Scenario: No appointments exist
- **WHEN** `admin_delete_all_appointments()` is called and the org has zero appointments
- **THEN** the function returns `0` (not an error)

#### Scenario: Appointments of all statuses deleted
- **WHEN** the org has appointments with statuses `pending`, `confirmed`, `cancelled`, `completed`, and `no_show`
- **THEN** all are deleted regardless of status

### Requirement: Admin Delete All Appointments Service Layer
The system SHALL provide `adminDeleteAllAppointments(): Promise<number>` in `src/services/adminAppointments.ts` (or a dedicated admin service). The function SHALL call the `admin_delete_all_appointments` RPC and return the deleted row count. It SHALL throw on RPC error.

#### Scenario: Successful deletion
- **WHEN** `adminDeleteAllAppointments()` is called and the RPC succeeds
- **THEN** the promise resolves with the count of deleted rows

#### Scenario: RPC error propagated
- **WHEN** the RPC returns an error
- **THEN** `adminDeleteAllAppointments()` throws with the error detail

### Requirement: Danger Zone Section in Business Settings
The system SHALL render a collapsible **"Zona de peligro"** section in `/admin/settings/business`, styled with a red border and warning color palette. The section SHALL contain an "Eliminar historial de reservas" action with double-confirmation UX. The first dialog SHALL display: *"Esta acción eliminará permanentemente todas las reservas. El historial es irrecuperable."* with a "Continuar" and a "Cancelar" button. The second dialog SHALL require the admin to type **"CONFIRMAR"** exactly before the destructive button becomes enabled. The confirm button SHALL remain disabled until the text matches exactly.

#### Scenario: Danger zone section renders
- **WHEN** an admin navigates to `/admin/settings/business`
- **THEN** the "Zona de peligro" section is visible (collapsed by default or visible)

#### Scenario: First confirmation dialog shown
- **WHEN** the admin clicks "Eliminar historial de reservas"
- **THEN** the first warning dialog appears with the exact copy and "Continuar" / "Cancelar" buttons

#### Scenario: Cancel at first dialog
- **WHEN** the admin clicks "Cancelar" in the first dialog
- **THEN** the dialog closes and no deletion is triggered

#### Scenario: Second confirmation requires typed CONFIRMAR
- **WHEN** the admin clicks "Continuar" in the first dialog
- **THEN** the second dialog appears with a text input; the destructive button is disabled until "CONFIRMAR" is typed exactly

#### Scenario: Partial text does not enable button
- **WHEN** the admin types "CONF" in the second confirmation input
- **THEN** the destructive button remains disabled

#### Scenario: Exact text enables button
- **WHEN** the admin types "CONFIRMAR" exactly in the second confirmation input
- **THEN** the destructive button becomes enabled

#### Scenario: Successful deletion shows confirmation
- **WHEN** the admin confirms and `adminDeleteAllAppointments()` resolves
- **THEN** the dialog closes, a success message is shown in Spanish, and the admin remains on the settings page

#### Scenario: Deletion failure shows error
- **WHEN** `adminDeleteAllAppointments()` rejects
- **THEN** a Spanish error message is displayed and no navigation occurs
