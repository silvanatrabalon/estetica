## Why

An admin who wanted to change a professional's role looked for it in Profesionales, where only the display name can be edited. Roles are managed in Usuarios, but nothing in that screen's name or copy said so.

## What Changes

- The admin menu entry and page title "Usuarios" become **"Usuarios y roles"**.
- The page subtitle states that roles (Cliente, Staff, Administrador) can be changed there.
- The edit panel is titled **"Editar usuario y roles"**.
- In Profesionales, the edit form explains that it only changes the display name and links to "Usuarios y roles" for role changes; the footer note links there too.

## Capabilities

### Modified Capabilities
- `admin-user-management-panel`: naming and copy that make role management discoverable
- `staff-professionals-management`: pointer from the edit form to role management

## User Flow

1. Admin opens Profesionales → Editar and reads that roles are changed in "Usuarios y roles".
2. Admin follows the link, picks the person and ticks or unticks Cliente, Staff or Administrador.

## Data Model

None. Copy and navigation only.

## Acceptance Criteria

- The menu entry, page title and edit panel say "Usuarios y roles" / "Editar usuario y roles".
- The Profesionales edit form (not the create form) shows the hint and a link to `/admin/users`.
- The footer note in Profesionales links to `/admin/users`.
