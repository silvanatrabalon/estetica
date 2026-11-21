## ADDED Requirements

### Requirement: Role management is discoverable
The admin menu entry and the page title MUST read "Usuarios y roles". The page subtitle MUST state that roles (Cliente, Staff, Administrador) can be changed there. The edit panel MUST be titled "Editar usuario y roles" and contain the role checkboxes.

#### Scenario: Menu and title mention roles
- **WHEN** an admin views the menu and opens the users page
- **THEN** the entry and the page title read "Usuarios y roles"

#### Scenario: Edit panel exposes roles
- **WHEN** an admin selects a user
- **THEN** the panel titled "Editar usuario y roles" shows Cliente, Staff and Administrador checkboxes

#### Scenario: No users
- **WHEN** there are no users to list
- **THEN** the page still shows the title "Usuarios y roles"
