## MODIFIED Requirements

### Requirement: Role management is discoverable
The admin menu entry and the page title MUST read "Usuarios y roles". The page MUST be a simple directory showing, for each user, name, email, roles and status, with two actions: "Editar roles" and "Desactivar"/"Reactivar". The directory MUST NOT contain role checkboxes, a personal data form or a delete button. "Editar roles" MUST open the per-user screen at `/admin/users/:userId`. That screen MUST contain a "Roles" block with Cliente, Staff and Administrador checkboxes, a "Datos" block (name, phone) and an "Eliminar usuario" block.

#### Scenario: Menu and title mention roles
- **WHEN** an admin views the menu and opens the users page
- **THEN** the entry and the page title read "Usuarios y roles"

#### Scenario: Directory stays simple
- **WHEN** an admin views the directory
- **THEN** each row shows name, email, roles and status, plus "Editar roles" and "Desactivar"/"Reactivar", and nothing else is editable inline

#### Scenario: Editar roles opens the user's screen
- **WHEN** an admin presses "Editar roles" on a user
- **THEN** the app opens `/admin/users/:userId` for that user with Roles, Datos and Eliminar usuario

#### Scenario: Role changes keep their protections
- **WHEN** an admin changes a role on the per-user screen
- **THEN** a confirmation is required, removing the last role is refused, an admin cannot remove their own admin role and the last active admin cannot be demoted

#### Scenario: Unknown user
- **WHEN** the per-user route has an id that does not exist
- **THEN** the screen says "No encontramos a ese usuario." and offers a link back

#### Scenario: Deleting a user
- **WHEN** an admin confirms "Eliminar usuario"
- **THEN** the user is deleted and the admin returns to the directory with a confirmation; on failure the screen stays and shows the error

#### Scenario: Deactivation from the directory
- **WHEN** an admin deactivates or reactivates a user from the list and confirms
- **THEN** the status changes, and deactivating the last active admin is blocked with a message

#### Scenario: No users
- **WHEN** there are no users to list
- **THEN** the page still shows the title "Usuarios y roles" and an empty-state message

#### Scenario: Per-user screen is admin-only
- **WHEN** a non-admin requests `/admin/users/:userId`
- **THEN** access is denied
