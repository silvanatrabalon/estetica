## ADDED Requirements

### Requirement: Professionals screen points to role management
The edit form of a professional MUST explain that it only changes the display name and MUST link to "Usuarios y roles" (`/admin/users`) for changing the person's role. The create form MUST NOT show this hint. The footer note of the screen MUST link to "Usuarios y roles".

#### Scenario: Edit form shows the pointer
- **WHEN** an admin opens "Editar" on a professional
- **THEN** the form shows where roles are changed, with a link to `/admin/users`

#### Scenario: Create form has no hint
- **WHEN** an admin opens the create form
- **THEN** the role hint is not shown

#### Scenario: Footer note links to Usuarios y roles
- **WHEN** the professionals list is shown
- **THEN** the footer note contains a link to `/admin/users`
