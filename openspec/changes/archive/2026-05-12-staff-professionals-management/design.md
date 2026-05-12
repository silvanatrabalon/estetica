## Context

The `staff_members` table was introduced in the foundation schema migration (`20260511013647`) but has no admin management surface. Currently, admin users have no way to create, view, or manage staff member records through the app. The `user_roles` table (managed via #9) handles global app role assignment, but it is independent of the `staff_members` entity.

The existing `AdminUsersPage` and its `adminUsers.ts` service establish the RPC-based admin data access pattern used throughout the project. This design follows those same patterns.

Single-tenant constraint: the app always operates against a single `organizations` record. Staff operations are always scoped to that singleton org — no org selection is needed.

## Goals / Non-Goals

**Goals:**
- Provide admins a panel to view, create, edit, and deactivate staff members
- Keep staff member creation tightly coupled to an existing user account (`profile_user_id` required)
- Auto-assign `user_roles.role = 'staff'` when a user is linked to a staff member (idempotent)
- Follow the established RPC admin function pattern for all DB operations
- All admin mutations are protected by `is_admin()` RLS function

**Non-Goals:**
- Creating new user accounts from this panel
- Managing staff availability or schedules (→ #12)
- Assigning services to staff (→ #14)
- Managing `organization_memberships` (single-tenant, not needed for MVP)
- Uploading staff photos or avatars
- Staff members that exist without a linked user account

## Decisions

### D1: RPC functions over direct table access

**Decision:** All admin staff operations use `SECURITY DEFINER` RPC functions, consistent with the pattern in `admin_list_users`, `admin_update_user_role`, etc.

**Rationale:** Direct table access from the frontend would require complex multi-table RLS policies. RPC functions encapsulate the join across `staff_members`, `profiles`, and `user_roles`, and allow atomic operations (e.g., create staff + assign role in one transaction).

**Alternatives considered:** Direct table insert with separate role update call — rejected because non-atomic; a failed role assignment would leave inconsistent state.

---

### D2: Auto-assign `staff` role on staff member creation

**Decision:** When `admin_create_staff_member()` is called, it inserts a `user_roles` row with `role = 'staff'` for the linked user if one does not already exist (upsert with `ON CONFLICT DO NOTHING`).

**Rationale:** A user linked to a staff member must have app-level `staff` access to use staff routes. Not auto-assigning would require a two-step admin flow (create staff + manually change role) which is error-prone.

**Alternatives considered:** Requiring admin to assign `staff` role separately via the existing User Management panel — rejected because it creates unnecessary friction and inconsistency risk.

---

### D3: No hard deletes — deactivate only

**Decision:** Staff members are deactivated via `is_active = false`, never deleted.

**Rationale:** Staff records will eventually be referenced by appointment history. Hard deleting would break referential integrity. Deactivated staff are hidden from default list views but remain in the database.

**Alternatives considered:** Soft delete with a `deleted_at` timestamp — rejected as over-engineering for MVP; `is_active` is already in the schema and serves the same purpose.

---

### D4: Admin staff page at `/admin/staff`

**Decision:** New route `/admin/staff` with admin-only RoleGuard, added to the admin navigation as "Profesionales".

**Rationale:** Consistent with the existing admin route pattern (`/admin/users`, `/admin/settings/business`). Admin sidebar navigation already supports adding entries via the `navigationByRole` config.

---

### D5: Service layer in `src/services/adminStaff.ts`

**Decision:** New service file following the `adminUsers.ts` pattern: RPC calls, snake_case → camelCase transformation, typed interfaces, throw on error.

**Rationale:** Keeps service layer consistent, testable, and decoupled from UI components.

## Risks / Trade-offs

- **Risk: User selected for staff already has `admin` role** → No risk. Auto-assign uses `ON CONFLICT DO NOTHING`, so existing roles are not downgraded. An admin user linked to a staff member keeps their admin role.
- **Risk: Deactivating a staff member does not revoke app access** → Known trade-off. `is_active` on `staff_members` controls the staff directory; it does NOT affect `user_roles.is_active`. If full app access revocation is needed, admin must also deactivate the user in #9's User Management panel. Document this in UI with a note.
- **Risk: Duplicate staff member for same user** → Prevented by existing unique constraint `ux_staff_members_org_profile_user` on `(organization_id, profile_user_id)`. The RPC function will return a clear error if a duplicate is attempted.

## Migration Plan

1. Add new migration with admin RPC functions: `admin_list_staff_members`, `admin_create_staff_member`, `admin_update_staff_member`, `admin_set_staff_active`
2. Grant execute on RPC functions to `authenticated` role
3. No changes to `staff_members` table structure (schema already correct)
4. Frontend: add route, page, service, navigation entry
5. Rollback: drop the RPC functions (no data changes to revert)

## Open Questions

- None. All decisions resolved based on backlog analysis and user decisions from the exploration session.
