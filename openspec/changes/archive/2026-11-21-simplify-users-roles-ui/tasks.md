## 1. Users

- [x] 1.1 Shared display helpers (`adminUsersView`)
- [x] 1.2 `AdminUserEditPage`: roles, data, delete, safety rules, not found / error states
- [x] 1.3 `AdminUsersPage` as a simple directory with Editar roles and Desactivar/Reactivar
- [x] 1.4 Route `/admin/users/:userId`

## 2. Professionals

- [x] 2.1 Card: "Cambiar nombre", "Editar roles"; remove hint from edit form

## 3. Tests

- [x] 3.1 Directory tests: list, links, deactivate/reactivate, last-admin block, search, empty, error, notice
- [x] 3.2 Edit screen tests: roles, confirmation, protections, data, delete, not found
- [x] 3.3 Professionals tests: buttons, navigation, hidden without linked user
- [x] 3.4 Routing test: per-user route is admin-only
