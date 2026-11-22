# admin-user-management-panel Specification

## Purpose
TBD - created by archiving change admin-user-management-panel. Update Purpose after archive.
## Requirements
### Requirement: Admin User Directory Coverage
The system MUST provide an admin-only user directory at `/admin/users` that includes authenticated accounts even when a profile row does not exist.

#### Scenario: Admin opens user directory
- **WHEN** an authenticated admin navigates to `/admin/users`
- **THEN** the system displays a directory that includes users with and without profile rows

#### Scenario: Non-admin attempts directory access
- **WHEN** an authenticated non-admin user attempts to access admin user directory behavior
- **THEN** the system denies access through existing authorization mechanisms

### Requirement: Deterministic Directory State UX
The system MUST expose deterministic loading, empty, success, and recoverable error states for admin user directory workflows.

#### Scenario: Directory loading state
- **WHEN** the directory data is being fetched
- **THEN** the UI shows a loading state in Spanish

#### Scenario: Directory empty state
- **WHEN** no user records are available for the directory query
- **THEN** the UI shows an empty state in Spanish with no broken actions

#### Scenario: Directory recoverable error state
- **WHEN** directory retrieval fails
- **THEN** the UI shows a recoverable error message in Spanish and allows retry

### Requirement: Global Role Management
The system MUST allow admin-only role updates for canonical global roles `customer`, `staff`, and `admin`.

#### Scenario: Admin updates user role
- **WHEN** an authenticated admin confirms a valid role change for a target user
- **THEN** the system persists the new canonical role and reflects the result in the admin UI

#### Scenario: Non-admin attempts role update
- **WHEN** a non-admin actor attempts to update another user's role
- **THEN** the mutation is denied by authorization controls

### Requirement: Role Safety Invariants
The system MUST block role actions that cause self-demotion or leave the system without any active admin users.

#### Scenario: Self-demotion attempt
- **WHEN** an admin attempts to remove their own required admin role
- **THEN** the system rejects the action and surfaces an explanatory message

#### Scenario: Last-admin lockout attempt
- **WHEN** an admin action would result in zero active admin users
- **THEN** the system rejects the action and preserves at least one active admin

### Requirement: Reversible Global User Deactivation
The system MUST support admin-only global user deactivation and reactivation, where deactivated users are blocked from application access behavior.

#### Scenario: Admin deactivates user
- **WHEN** an authenticated admin confirms deactivation for an active user
- **THEN** the user status becomes inactive and subsequent app access behavior for that user is blocked

#### Scenario: Admin reactivates user
- **WHEN** an authenticated admin confirms reactivation for an inactive user
- **THEN** the user status becomes active and standard app access behavior is restored

### Requirement: MVP Admin User Analytics
The system MUST provide lightweight admin-only analytics for user operations: total users, active vs inactive users, role distribution, and recent signups in the last 30 days.

#### Scenario: Admin views user analytics summary
- **WHEN** an authenticated admin loads the admin users panel
- **THEN** the UI shows the four agreed MVP user analytics KPIs

### Requirement: Spanish User-Facing Admin Copy
The system MUST present user-facing admin panel copy in Spanish for user management states and action feedback.

#### Scenario: Action feedback is shown
- **WHEN** role or deactivation actions succeed or fail
- **THEN** the visible feedback copy is displayed in Spanish

### Requirement: Test Coverage For Admin User Management MVP
The system MUST include automated tests for critical user management behavior.

#### Scenario: Frontend coverage execution
- **WHEN** frontend test suites run for this capability
- **THEN** unit and integration coverage validates directory states, role changes, deactivation/reactivation, and non-admin denial paths

#### Scenario: SQL/RLS smoke execution
- **WHEN** database smoke tests run for this capability
- **THEN** admin-only mutation paths are allowed and non-admin mutation paths are denied

### Requirement: Role management is discoverable
The admin menu entry and the page title MUST read "Usuarios y roles". The page MUST be a simple directory showing, for each user, name, email, roles and status, with two actions: "Editar roles" and "Desactivar"/"Reactivar". The directory MUST NOT contain role checkboxes, a personal data form or a delete button. "Editar roles" MUST open the per-user screen at `/admin/users/:userId`. That screen MUST contain a "Roles" block with Cliente, Staff and Administrador checkboxes, a "Datos" block (name, phone) and an "Eliminar usuario" block.

#### Scenario: Menu and title mention roles
- **WHEN** an admin views the menu and opens the users page
- **THEN** the entry and the page title read "Usuarios y roles"

#### Scenario: Directory stays simple
- **WHEN** an admin views the directory
- **THEN** each row shows name, email, roles and status, plus "Editar roles" and, except on the row of the person using the app, "Eliminar" (with a confirmation that says their upcoming turns are cancelled), and nothing else is editable inline

#### Scenario: Editar roles opens the user's screen
- **WHEN** an admin presses "Editar roles" on a user
- **THEN** the app opens `/admin/users/:userId` for that user with Roles and Datos (deleting is not part of that pop-up)

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

### Requirement: Add a user before they sign in
Usuarios y roles SHALL offer "+ Agregar usuario": email (required), name (optional) and any of the roles Administrador, Staff and Cliente (Cliente checked by default, at least one required). Nothing is created in the account system: an invitation is saved and listed under "Invitaciones pendientes" with its roles.

#### Scenario: First sign-in
- **WHEN** the person signs in for the first time with that email (their profile is created)
- **THEN** they get exactly the invited roles (the default client role is dropped unless it was invited), take the invited name if their account has none, and the invitation disappears

#### Scenario: Staff role
- **WHEN** the invitation includes Staff
- **THEN** a professional without account is created right away with that email, so it appears in Profesionales and can be given schedules; at first sign-in it is linked to the account

#### Scenario: The email already has an account
- **WHEN** the admin invites an email that already belongs to an account
- **THEN** nothing is created and the screen points to "Editar roles" of that account

#### Scenario: Remove an invitation
- **WHEN** the admin removes a pending invitation
- **THEN** it is deleted, together with the professional created for it unless that professional already has appointments

An email can have only one pending invitation. The email is the only thing that links the person: they must sign in with exactly that email.

### Requirement: "Editar roles" abre una ventana, no otra pantalla
"Editar roles" SHALL abrir una ventana emergente sobre el directorio de Usuarios y roles (en el celular sube desde abajo como una hoja, en pantallas más grandes aparece centrada), en lugar de navegar a otra pantalla. La ventana tiene el bloque "Roles" (Cliente, Staff, Administrador, cada cambio con confirmación), el bloque "Datos" (nombre y teléfono, con "Guardar perfil de usuario") y el bloque "Eliminar usuario" (con confirmación). Se cierra con ×, con Escape (salvo que haya una confirmación abierta) o sola al eliminar. Los cambios actualizan la lista de atrás. La dirección `/admin/users/:userId` sigue funcionando y abre el directorio con esa ventana ya abierta; al cerrarla vuelve a `/admin/users`. Esto reemplaza lo dicho antes sobre la pantalla por usuario.

### Requirement: La ventana de "Editar roles" va al grano
La ventana de "Editar roles" NO SHALL llevar la explicación de los roles bajo las casillas, el título "Datos" ni el recuadro de último acceso, alta y estado. Quedan: los roles, el nombre y el teléfono con su botón de guardar, y el bloque para eliminar al usuario.

### Requirement: Sin "Desactivar" ni estado Activo/Inactivo
Usuarios y roles NO SHALL ofrecer "Desactivar"/"Reactivar" ni mostrar la etiqueta Activo/Inactivo: desactivar solo quitaba los permisos de administrador y staff (la cuenta seguía pudiendo entrar y reservar como cliente), y para eso alcanza con sacar el rol en "Editar roles". Cada usuario de la lista tiene solo "Editar roles". El segundo desplegable pasa a ser **Cuenta** (Todas, Con cuenta, Sin cuenta) en lugar de Estado. La explicación de la pantalla habla de quién tiene cuenta y qué roles tiene. Esto reemplaza lo dicho antes sobre "Desactivar"/"Reactivar", el estado y el filtro Activos/Inactivos. La función de la base `admin_set_user_active` queda sin uso.

### Requirement: Nombre vacío usa el del email
En el popup de Editar roles, el nombre ya no bloquea el guardado: si se deja vacío se guarda el nombre que da el email (lo que está antes de la @), que también se muestra como sugerencia en el campo, así la cuenta nunca queda sin nombre. Solo si la cuenta no tiene email el nombre sigue siendo obligatorio.

