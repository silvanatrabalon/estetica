## Context

The current `user_roles` table uses `user_id` as the primary key, enforcing exactly one role per user. The RLS helper functions (`is_admin()`, `is_staff_or_admin()`, `current_app_role()`) all perform a single-row lookup and return the one role stored. The `UserContext` frontend holds a single `role: AppRole | null` value.

This is a **breaking schema change** with broad downstream impact: the DB table, all RLS helpers, the frontend session context, the admin users panel, and all related tests must be updated together.

## Goals / Non-Goals

**Goals:**
- Allow one user account to hold multiple canonical roles simultaneously
- Surface a role selector at login when more than one role is assigned
- Provide mid-session role switch via "Cambiar modo" in the user menu
- Update the Admin Users panel to assign/revoke individual roles with checkboxes
- Preserve all existing RLS policies without rewriting them (only helper functions change)
- Maintain zero behavior change for single-role users (no selector shown, no context API change at the consumer level)

**Non-Goals:**
- Organization-scoped role assignments (multi-tenant is out of scope)
- Per-session role restriction at the DB level (RLS always enforces all assigned roles)
- Role hierarchy or inheritance
- Staff self-service role requests
- Audit log for role changes (covered in #33)

## Decisions

### D1: Composite PK on `user_roles` instead of a separate junction table

**Decision:** Drop `PRIMARY KEY (user_id)` and add `PRIMARY KEY (user_id, role)` directly on `user_roles`.

**Rationale:** The table is already the canonical role assignment store. Adding a composite PK is a minimal structural change that preserves the existing shape (same columns, same table name) and requires no data model reshaping. A new junction table would rename the source of truth and force updates to every query and RLS reference.

**Alternative considered:** New `user_role_assignments (user_id, role)` table with `user_roles` kept as a profile lookup. Rejected — unnecessary table proliferation, all queries would need rewriting.

### D2: `activeRole` lives only in frontend session context, not in DB

**Decision:** The currently selected role mode is stored only in `UserContext` (React state), never persisted to the database.

**Rationale:** Resets on sign-out and sign-in are the correct UX. Persisting it would add DB complexity for zero security benefit — RLS enforces all assigned roles regardless of which mode the user is "in".

**Alternative considered:** A `active_role` column on `user_roles` or a session table. Rejected — RLS cannot safely restrict admin-role RPCs based on a DB-stored active-role preference, so persisting it would create a false sense of restriction.

### D3: RLS helper functions updated in-place

**Decision:** `is_admin()`, `is_staff_or_admin()`, `current_app_role()` are updated using `CREATE OR REPLACE FUNCTION` — same function signatures, bodies changed to use `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = ...)`.

**Rationale:** All existing RLS policies call these functions by name. Updating in-place requires zero changes to any policy definition.

**Alternative considered:** New function names (`is_admin_v2()` etc.). Rejected — forces touching every RLS policy.

### D4: `current_app_role()` is preserved for compatibility

**Decision:** `current_app_role()` continues to return a single role using a precedence rule: `admin` > `staff` > `customer`. A new `get_user_roles()` function returns `app_role[]`.

**Rationale:** Some existing code may rely on `current_app_role()` returning a single value. The migration should be additive first.

### D5: Single-role users see no UX change

**Decision:** The role selector is only shown when `roles.length > 1`. Single-role users are directed to their role home immediately as before.

**Rationale:** Zero regression for existing users with a single role.

## Risks / Trade-offs

- **[Risk] Breaking DB migration on `user_roles` PK** → Mitigation: Migration drops the old PK constraint and adds the composite PK atomically. Data is preserved — existing rows become valid single-role entries under the new model. Rollback by restoring the original PK (only safe if no multi-role rows have been inserted).
- **[Risk] Tests that mock `UserContext.role`** → Mitigation: `role` in `UserContext` is renamed to `activeRole`. All tests importing `role` must be updated. Provides a compile-time error at TypeScript level.
- **[Risk] `admin_update_user_role` RPC becomes `admin_assign_user_role` / `admin_revoke_user_role`** → Mitigation: Old RPC still exists until all callers are migrated; new RPCs added in same migration.
- **[Risk] Admin Users panel shows incorrect role if multiple roles assigned** → Mitigation: Panel fetches all roles per user from new RPC and renders checkbox set, not a single value.

## Migration Plan

1. **DB migration** — single versioned SQL file:
   - Drop `PRIMARY KEY (user_id)` constraint
   - Add `PRIMARY KEY (user_id, role)` composite constraint
   - Update `is_admin()`, `is_staff_or_admin()`, `current_app_role()` function bodies
   - Add `get_user_roles()` returning `app_role[]`
   - Add `admin_assign_user_role(target_user_id, role)` RPC
   - Add `admin_revoke_user_role(target_user_id, role)` RPC with last-admin lockout
2. **Frontend** — update `UserContext` before updating consumers (TypeScript will surface all breakages)
3. **Update consumers** — `RoleGuard`, navigation, routing policy, admin panel
4. **Tests** — update all mocks and assertions touching `role`

**Rollback:** Re-apply old function bodies + restore PK constraint. Only safe if no multi-role rows exist.

## Open Questions

- None — all design decisions are resolved above.
