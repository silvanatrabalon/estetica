### Requirement: Admin controls per professional whether they can edit their own availability
The system SHALL store, for each professional, a flag `can_edit_own_availability` that the admin can change from the Profesionales screen. The flag MUST default to true, so existing and newly created professionals can edit their own availability until the admin removes the permission.

#### Scenario: Admin removes the permission
- **WHEN** an admin unticks "Puede editar su propia disponibilidad" for a professional
- **THEN** the flag is saved as false and a Spanish confirmation is shown

#### Scenario: Admin restores the permission
- **WHEN** an admin ticks the box again
- **THEN** the flag is saved as true and the professional can edit again

#### Scenario: Saving the permission fails
- **WHEN** the request fails
- **THEN** the checkbox returns to its previous state and a Spanish error is shown

#### Scenario: Permissions cannot be loaded
- **WHEN** the permission lookup fails while loading Profesionales
- **THEN** the checkbox is hidden and the rest of the page works

#### Scenario: New professional
- **WHEN** a professional is created
- **THEN** their flag is true

### Requirement: The permission is enforced by the server
The self-service RPCs `staff_set_my_schedule`, `staff_upsert_my_exception` and `staff_delete_my_exception` MUST reject the call with a Spanish permission error (SQLSTATE 42501) when the caller's professional has the flag set to false. Admins MUST NOT be blocked. The admin RPCs that edit any professional's availability MUST remain unaffected.

#### Scenario: Blocked professional cannot change the schedule
- **WHEN** a professional with the flag off calls `staff_set_my_schedule`
- **THEN** the call fails with "No tenés permiso para editar tu disponibilidad. Contactá al administrador." and nothing changes

#### Scenario: Blocked professional cannot add or delete exceptions
- **WHEN** a professional with the flag off calls `staff_upsert_my_exception` or `staff_delete_my_exception`
- **THEN** the call fails with the same message and nothing changes

#### Scenario: Allowed professional edits as before
- **WHEN** a professional with the flag on calls any self-service RPC
- **THEN** it behaves exactly as before

#### Scenario: Admin is never blocked
- **WHEN** an admin who also has a professional profile with the flag off calls a self-service RPC
- **THEN** the call succeeds

#### Scenario: Admin still edits a blocked professional
- **WHEN** an admin edits a blocked professional's availability from Profesionales → Disponibilidad
- **THEN** the change is saved

### Requirement: Professional's availability page reflects the permission
When the permission is off, "Mi disponibilidad" MUST show the notice "Tu administrador define tus horarios. Podés verlos acá, pero no modificarlos.", display the weekly schedule with all controls disabled and no save button, hide the exception form and hide the delete buttons, while still listing existing exceptions. When the permission is on, the page MUST be fully editable. If the permission lookup fails, the page MUST remain editable and rely on the server check.

#### Scenario: Read-only view
- **WHEN** a blocked professional opens "Mi disponibilidad"
- **THEN** they see the notice, their schedule and exceptions, and no way to change them

#### Scenario: Read-only with no schedule
- **WHEN** a blocked professional has no schedule yet
- **THEN** the page tells them to ask their administrator

#### Scenario: Editable view
- **WHEN** an allowed professional opens "Mi disponibilidad"
- **THEN** no notice is shown and they can save the schedule and manage exceptions

#### Scenario: Permission lookup fails
- **WHEN** the lookup fails
- **THEN** the page is editable and any save is still checked by the server
