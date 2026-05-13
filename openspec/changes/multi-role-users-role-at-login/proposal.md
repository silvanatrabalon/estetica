## Why

Today `user_roles` enforces a single role per user (`user_id PRIMARY KEY`), forcing owner-operators who are both admin and staff to permanently choose one role. This feature enables a single account to hold multiple roles and choose which context to enter at login, supporting the real workflow of a business owner who also works as a practitioner.

## What Changes

- **BREAKING** — `user_roles` primary key changes from `(user_id)` to `(user_id, role)`: one row per role assignment instead of one row per user
- All Supabase RLS helper functions (`is_admin()`, `is_staff_or_admin()`, `current_app_role()`) updated to query for role existence in the multi-row set
- New DB function `get_user_roles()` returns all assigned roles for the authenticated user
- `UserContext` extended to expose `roles: AppRole[]` (all assigned) + `activeRole: AppRole` (chosen for this session)
- New `RoleSelector` component shown post-authentication when a user has multiple roles
- User menu gains "Cambiar modo" option to switch `activeRole` mid-session without sign-out
- Admin Users panel replaces single-role dropdown with multi-role checkboxes per user
- `RoleGuard`, navigation config, and routing policy updated to use `activeRole`
- Default role on first sign-up remains `customer` (single row insert — no behavior change for single-role users)

## Capabilities

### New Capabilities

- `multi-role-users-role-at-login`: Multi-role user model with session-scoped active role selection. Covers DB migration from single-role to multi-role table, updated RLS helper functions, role selector UX at login, mid-session role switching, and admin panel updates for assigning/revoking individual roles per user.

### Modified Capabilities

- `role-model-and-user-roles`: The `user_roles` table structure changes from single-role-per-user to multi-role-per-user with a composite PK. The RLS helper functions `is_admin()`, `is_staff_or_admin()`, and `current_app_role()` are updated to support multi-row lookups.
- `protected-routes-and-role-guards`: `RoleGuard` and route access policy now use `activeRole` from `UserContext` instead of the single `role` field. No new routes; behavioral change in guard evaluation.
- `user-session-lifecycle-management`: Session bootstrap now fetches all assigned roles for the authenticated user and resolves `activeRole` during startup (single-role users enter directly; multi-role users are routed to the role selector).

## Impact

- **Database migration** — `user_roles` PK change is a breaking schema change requiring a versioned migration with data preservation
- **All RLS policies** — remain valid (they call helper functions); only helper function bodies change
- `src/context/UserContext.tsx` — extend `role` → `activeRole` + `roles[]`
- `src/components/routing/RoleGuard.tsx` — use `activeRole`
- `src/lib/navigation.ts` — navigation filtered by `activeRole`
- `src/lib/routing.ts` — route policy evaluation uses `activeRole`
- `src/pages/AdminUsersPage.tsx` — replace role dropdown with multi-role checkboxes
- `src/services/adminUsers.ts` — update role list/assign/revoke service functions
- New component: `src/components/auth/RoleSelector.tsx`
- All existing tests touching `UserContext` role state require updates
