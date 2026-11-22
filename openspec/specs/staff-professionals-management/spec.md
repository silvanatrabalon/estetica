## Purpose
Admin capability to manage staff professionals: create, edit, deactivate/reactivate staff members linked to existing users, and navigate to per-member availability and service assignment sub-pages.
## Requirements
### Requirement: Admin-Only Staff Directory
The system MUST provide an admin-only staff directory that displays all staff members with their active/inactive status, linked user information, and action links to manage availability and assigned services.

#### Scenario: Admin opens staff management page
- **WHEN** an authenticated admin navigates to the staff management page
- **THEN** the system loads and displays all staff members with their display name, active status, linked user name, a link to manage availability, and a link to manage assigned services

#### Scenario: Non-admin attempts staff management access
- **WHEN** an authenticated non-admin user attempts to access the staff management page
- **THEN** the system denies access through existing authorization mechanisms

#### Scenario: Staff directory shows empty state
- **WHEN** an admin opens the staff directory with no staff members created yet
- **THEN** the system displays an empty state with a call to action to create the first staff member

### Requirement: Create Staff Member Linked To Existing User
The system MUST allow admins to create a staff member by selecting an existing app user and providing a display name.

#### Scenario: Admin creates staff member
- **WHEN** an authenticated admin selects an existing user and provides a valid display name and submits
- **THEN** the system creates a staff member record linked to that user and the new staff member appears in the directory

#### Scenario: Creating staff member auto-assigns staff role
- **WHEN** an admin creates a staff member linked to a user who does not have the `staff` role
- **THEN** the system assigns the `staff` role to that user automatically as part of the create operation

#### Scenario: Creating staff member for user who already has staff role
- **WHEN** an admin creates a staff member linked to a user who already has the `staff` or `admin` role
- **THEN** the system creates the staff member without changing the existing role

#### Scenario: Duplicate staff member is rejected
- **WHEN** an admin attempts to create a staff member for a user who is already linked to an existing staff member
- **THEN** the system rejects the operation and surfaces a descriptive error in Spanish

#### Scenario: Display name validation fails
- **WHEN** an admin submits a display name that is empty or fewer than 2 characters
- **THEN** the system rejects the input and displays a validation error in Spanish

### Requirement: Edit Staff Member Display Name And Status
The system MUST allow admins to edit a staff member's display name and active status.

#### Scenario: Admin edits display name
- **WHEN** an authenticated admin submits a valid updated display name for a staff member
- **THEN** the system persists the new display name

#### Scenario: Admin edits invalid display name
- **WHEN** an admin submits a display name that is empty or fewer than 2 characters
- **THEN** the system rejects the input and displays a validation error in Spanish

### Requirement: Reversible Staff Member Deactivation
The system MUST support reversible deactivation of staff members without hard deletion.

#### Scenario: Admin deactivates active staff member
- **WHEN** an authenticated admin deactivates an active staff member
- **THEN** the staff member is marked as inactive and the change is reflected in the directory

#### Scenario: Admin reactivates inactive staff member
- **WHEN** an authenticated admin reactivates an inactive staff member
- **THEN** the staff member is marked as active and the change is reflected in the directory

#### Scenario: Deactivation does not revoke app access
- **WHEN** an admin deactivates a staff member
- **THEN** the staff member's app user account access is not revoked; only the staff member record is marked inactive

### Requirement: Spanish User-Facing Staff Management Copy
The system MUST present all staff management UI copy in Spanish for loading, validation, warning, success, and error states.

#### Scenario: Staff management feedback is shown
- **WHEN** staff management actions succeed, fail, or require confirmation
- **THEN** all visible copy is displayed in Spanish

### Requirement: Test Coverage For Staff Management MVP
The system MUST include automated test coverage for critical staff management behavior.

#### Scenario: Frontend unit and integration coverage
- **WHEN** frontend test suites run for staff management
- **THEN** unit and integration coverage validates admin-only access, display name validation, create/edit/deactivate/reactivate flows

#### Scenario: RLS smoke coverage
- **WHEN** database smoke tests run for staff management
- **THEN** admin-only mutation paths are validated and non-admin denial is confirmed

### Requirement: Professionals screen points to role management
Each professional card MUST offer "Cambiar nombre" (edits only the display name), "Editar roles" (opens `/admin/users/<linked user id>`), "Disponibilidad", "Servicios" and "Desactivar"/"Reactivar". A professional without a linked user MUST NOT show "Editar roles". The edit form MUST only change the display name. The footer note MUST link to "Usuarios y roles".

#### Scenario: Card buttons
- **WHEN** the professionals list is shown
- **THEN** each card has "Cambiar nombre" and "Editar roles" and no ambiguous "Editar" button

#### Scenario: Editar roles opens the user's screen
- **WHEN** an admin presses "Editar roles" on a professional
- **THEN** the app opens that person's screen in Usuarios y roles

#### Scenario: No linked user
- **WHEN** a professional has no linked user
- **THEN** "Editar roles" is not shown

#### Scenario: Edit form changes only the name
- **WHEN** an admin presses "Cambiar nombre"
- **THEN** the form edits only the display name and shows no role hint

#### Scenario: Footer note links to Usuarios y roles
- **WHEN** the professionals list is shown
- **THEN** the footer note contains a link to `/admin/users`

### Requirement: Professional cards show all roles of the linked user
Each professional card MUST show one badge per role of the linked user (Administrador, Staff, Cliente), highest role first, using the roles from the users directory. If the linked user is not found or the professional has no linked user, the card MUST fall back to the single role returned by the staff list.

#### Scenario: Several roles
- **WHEN** the linked user is Administrador, Staff and Cliente
- **THEN** the card shows the three badges in that order

#### Scenario: Single role
- **WHEN** the linked user has only Staff
- **THEN** only the "Staff" badge is shown

#### Scenario: Linked user not found or none
- **WHEN** the user is missing from the directory or the professional has no linked user
- **THEN** the card shows the role returned by the staff list

### Requirement: A professional's name is the name of their account
`staff_members.display_name` SHALL always equal the account's name (profile full name; if the account has none, the email prefix at creation). Creating a professional ignores any typed name, renaming the account renames the professional (a blank name never overwrites it), and existing professionals were aligned once. There is no separate "nombre para mostrar" and no "Cambiar nombre" action; the name is edited in Usuarios y roles.

### Requirement: Professionals without an account
The admin can create a professional with just a name and an optional email ("Sin cuenta" in the creation form). It appears in the list with a "Sin cuenta" badge and, when there is an email, "Invitación: {email}". It can have availability and services and receives appointments like any other.

#### Scenario: Invitation by email
- **WHEN** a person signs in for the first time with the email saved on a professional without account
- **THEN** they are linked to that professional, get the staff role and take the name of their account

#### Scenario: The email already has an account
- **WHEN** the admin creates the professional with an email that already belongs to an account
- **THEN** the professional is linked right away (unless that account already has one)

#### Scenario: Link by hand
- **WHEN** the admin chooses "Vincular cuenta" and picks an account without a professional
- **THEN** the professional is linked, gets the staff role and takes the account's name

#### Scenario: Rename
- **WHEN** the professional has no account
- **THEN** "Cambiar nombre" is available; linked professionals have no such action (their name is the account's)

Two professionals without account cannot share the same invitation email.
