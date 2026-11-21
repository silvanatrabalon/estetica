## Why

The Usuarios screen mixed a directory, a selection panel, role checkboxes, personal data, activation and deletion on one page, so it was hard to find anything. An admin looking to change a professional's role looked in Profesionales, where the button "Editar" only changes the display name.

## What Changes

- **Usuarios y roles** becomes a simple directory: name, email, roles, status, and two actions per row: **Editar roles** and **Desactivar/Reactivar**.
- New per-user screen `/admin/users/:userId` ("Editar roles" destination) with three blocks: **Roles**, **Datos** (name, phone) and **Eliminar usuario**. The same safety rules as before apply.
- **Profesionales**: each card shows **Cambiar nombre** (was "Editar"), **Editar roles** (goes to the user's screen), Disponibilidad, Servicios and Desactivar. The role hint inside the edit form is removed.
- After deleting a user, the admin returns to the directory with a confirmation.

## Capabilities

### Modified Capabilities
- `admin-user-management-panel`: directory simplified; per-user edit screen
- `staff-professionals-management`: card buttons point to role editing

## User Flow

1. Admin opens Usuarios y roles and sees a clean list.
2. Presses **Editar roles** on a person → screen with Roles, Datos and Eliminar.
3. In Profesionales, presses **Editar roles** on a professional → the same screen.
4. Activating or deactivating stays one click (with confirmation) on the list.

## Data Model

None. Navigation and UI only.

## Acceptance Criteria

- The directory has no checkboxes, no data form and no delete button.
- Each row links to `/admin/users/:userId`; unknown ids show "No encontramos a ese usuario.".
- Role changes keep confirmation, at-least-one-role, self-demotion and last-admin protections.
- Deactivating the last active admin is blocked from the list.
- The per-user route is admin-only through the existing `/admin/users` policy.
- A professional without a linked user has no "Editar roles" button.
