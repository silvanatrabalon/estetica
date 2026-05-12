## Why

The business needs to manage the professionals who provide services. Without a staff directory, there is no way to assign services to specific professionals or build the scheduling system that depends on staff availability. This change establishes the staff member entity as the foundational prerequisite for services assignment (#14) and availability configuration (#12).

## What Changes

- New admin-only staff management page at `/admin/staff`
- Admin can view the full staff directory with active/inactive status and linked user indicator
- Admin can create a staff member by selecting an existing app user and providing a display name
- Creating a staff member automatically assigns the `staff` role to the linked user if not already set
- Admin can edit a staff member's display name and active status
- Admin can reversibly deactivate or reactivate a staff member (no hard deletes)
- New admin-only RPC database functions for all staff operations
- New admin navigation entry for the staff management panel

## Capabilities

### New Capabilities
- `staff-professionals-management`: Admin panel to create, view, edit, and deactivate staff members. Each staff member is linked to an existing app user account. Creating a staff member auto-assigns the `staff` role to the linked user if not already set. Includes reversible deactivation and active/inactive directory view.

### Modified Capabilities
- `protected-routes-and-role-guards`: Add admin-only route `/admin/staff` to the route access matrix
- `supabase-rls-access-control`: Add admin-only RPC functions and RLS policies for `staff_members` write operations
- `supabase-schema-foundation`: The `staff_members` table already exists in foundation schema; this change adds required admin RPC functions and tightens the `profile_user_id` required constraint for this flow

## Impact

- **New page**: `src/pages/AdminStaffPage.tsx`
- **New service**: `src/services/adminStaff.ts` (RPC-based, following `adminUsers.ts` pattern)
- **New route**: `/admin/staff` (admin-only, added to routing config and navigation)
- **Database**: New admin RPC functions (`admin_list_staff_members`, `admin_create_staff_member`, `admin_update_staff_member`, `admin_set_staff_active`) in a new migration
- **Navigation**: Admin sidebar gains a "Profesionales" entry
- **Dependencies**: Requires existing `staff_members` table, `user_roles` table, and `profiles` table (all present in foundation schema)
