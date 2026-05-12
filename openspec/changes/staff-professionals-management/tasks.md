## 1. Database Migration

- [x] 1.1 Create new migration file `supabase/migrations/<timestamp>_staff_admin_rpc_functions.sql`
- [x] 1.2 Implement `admin_list_staff_members()` RPC: returns staff members joined with profiles (full_name) and user_roles (role), returning columns `id`, `organization_id`, `profile_user_id`, `display_name`, `is_active`, `created_at`, `full_name`, `role`
- [x] 1.3 Implement `admin_create_staff_member(p_profile_user_id uuid, p_display_name text)` RPC: inserts into `staff_members` with the singleton org id, then upserts `user_roles` to assign `staff` role using `ON CONFLICT DO NOTHING`
- [x] 1.4 Implement `admin_update_staff_member(p_staff_id uuid, p_display_name text)` RPC: updates `display_name` for the given staff member
- [x] 1.5 Implement `admin_set_staff_active(p_staff_id uuid, p_is_active boolean)` RPC: updates `is_active` for the given staff member
- [x] 1.6 Mark all four RPC functions as `SECURITY DEFINER` with `is_admin()` guard (raise exception if caller is not admin)
- [x] 1.7 Grant `EXECUTE` on all four RPC functions to `authenticated` role
- [x] 1.8 Apply migration to remote: `npx supabase db push`

## 2. Service Layer

- [x] 2.1 Create `src/services/adminStaff.ts` with `AdminStaffMember` interface (camelCase: `id`, `organizationId`, `profileUserId`, `displayName`, `isActive`, `createdAt`, `fullName`, `role`)
- [x] 2.2 Implement `listAdminStaffMembers(): Promise<AdminStaffMember[]>` calling `supabase.rpc('admin_list_staff_members')`
- [x] 2.3 Implement `adminCreateStaffMember(profileUserId: string, displayName: string): Promise<AdminStaffMember>` calling `supabase.rpc('admin_create_staff_member', {...})`
- [x] 2.4 Implement `adminUpdateStaffMember(staffId: string, displayName: string): Promise<AdminStaffMember>` calling `supabase.rpc('admin_update_staff_member', {...})`
- [x] 2.5 Implement `adminSetStaffActive(staffId: string, isActive: boolean): Promise<void>` calling `supabase.rpc('admin_set_staff_active', {...})`
- [x] 2.6 Export all functions from `src/services/index.ts`

## 3. Routing And Navigation

- [x] 3.1 Add `/admin/staff` route policy to `routePolicies` array in `src/lib/routing.ts` with `access: 'role-restricted'` and `allowedRoles: ['admin']`
- [x] 3.2 Add `staff-professionals` nav entry to `navigationByRole.admin` array in `src/lib/navigation.ts` with label from `uiCopy` and `href: '/admin/staff'`
- [x] 3.3 Add `staff` (profesionales) label key to `navigationCopy` in `src/lib/uiCopy.ts`
- [x] 3.4 Wire `AdminStaffPage` into the router in `src/App.tsx` at path `/admin/staff`
- [x] 3.5 Update routing tests in `src/lib/routing.test.ts` to include the new `/admin/staff` route policy

## 4. Admin Staff Page

- [x] 4.1 Create `src/pages/AdminStaffPage.tsx` with loading, error, and empty states
- [x] 4.2 Implement staff directory list view: table/list with columns for display name, linked user name, role badge, active status, and action buttons (edit / deactivate / reactivate)
- [x] 4.3 Implement create staff member flow: modal or inline form with user select (dropdown of existing users from `listAdminUsers`) and display name input
- [x] 4.4 Implement edit staff member flow: modal or inline form pre-filled with current display name
- [x] 4.5 Implement deactivate/reactivate toggle with confirmation prompt in Spanish
- [x] 4.6 Display inline note clarifying that deactivating a staff member does not revoke app access
- [x] 4.7 All copy (labels, buttons, validation messages, empty state, loading state, error state) in Spanish
- [x] 4.8 Export `AdminStaffPage` from `src/pages/index.ts`

## 5. Tests

- [x] 5.1 Create `src/pages/AdminStaffPage.test.tsx` with mock for `src/services/adminStaff`
- [x] 5.2 Test: loading state renders correctly
- [x] 5.3 Test: empty state renders when no staff members are returned
- [x] 5.4 Test: staff directory renders with mocked data (display name, linked user, active status)
- [x] 5.5 Test: display name validation error shown for empty or too-short input on create form
- [x] 5.6 Test: display name validation error shown for empty or too-short input on edit form
- [x] 5.7 Test: create staff member calls `adminCreateStaffMember` with correct arguments
- [x] 5.8 Test: deactivate calls `adminSetStaffActive` with `false`
- [x] 5.9 Test: reactivate calls `adminSetStaffActive` with `true`
- [x] 5.10 Confirm all existing tests still pass: `npm run test`
