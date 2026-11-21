## MODIFIED Requirements

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

## ADDED Requirements

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
