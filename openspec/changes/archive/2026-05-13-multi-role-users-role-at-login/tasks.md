## 1. Database Migration

- [x] 1.1 Write migration: drop `PRIMARY KEY (user_id)` on `user_roles` and add `PRIMARY KEY (user_id, role)` composite constraint (data-preserving)
- [x] 1.2 Write migration: update `is_admin()` to use `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')`
- [x] 1.3 Write migration: update `is_staff_or_admin()` to use `EXISTS` check for `staff` or `admin` row
- [x] 1.4 Write migration: update `current_app_role()` to return highest-privilege role using precedence `admin > staff > customer`
- [x] 1.5 Write migration: add `get_user_roles()` SECURITY DEFINER function returning `app_role[]` for `auth.uid()`
- [x] 1.6 Write migration: add `admin_assign_user_role(target_user_id uuid, role app_role)` SECURITY DEFINER RPC with admin-only guard
- [x] 1.7 Write migration: add `admin_revoke_user_role(target_user_id uuid, role app_role)` SECURITY DEFINER RPC with last-admin lockout protection
- [x] 1.8 Apply migration to local Supabase and verify existing single-role rows are preserved

## 2. UserContext — Multi-Role Session

- [x] 2.1 Update `AppUser` type: replace `role: AppRole` with `roles: AppRole[]` and add `activeRole: AppRole`
- [x] 2.2 Update `UserContext` bootstrap: call `get_user_roles()` RPC to fetch all roles after session restore
- [x] 2.3 Update `UserContext` bootstrap: set `activeRole` to the single role if `roles.length === 1`, else leave `activeRole` unset (null) so selector is shown
- [x] 2.4 Add `setActiveRole(role: AppRole): void` to context API
- [x] 2.5 Clear `activeRole` and `roles` on sign-out
- [x] 2.6 Update all consumers of `role` (TypeScript compile errors will surface them) to use `activeRole`

## 3. Role Selector Component

- [x] 3.1 Create `src/components/auth/RoleSelector.tsx` — displays a card per assigned role with Spanish copy
- [x] 3.2 On role card click, call `setActiveRole` and navigate to role home
- [x] 3.3 Add route `/seleccionar-rol` (or similar) and protect it to authenticated-only, bypass RoleGuard

## 4. Post-Login Routing Logic

- [x] 4.1 Update sign-in success handler: if `roles.length > 1` route to role selector, else route to role home
- [x] 4.2 Update session restoration handler (app bootstrap): same branching logic

## 5. Mid-Session Role Switch

- [x] 5.1 Add "Cambiar modo" entry to user menu — visible only when `roles.length > 1`
- [x] 5.2 On "Cambiar modo" click, route user to role selector screen
- [x] 5.3 Verify that switching roles mid-session redirects correctly and `activeRole` updates in context

## 6. RoleGuard Update

- [x] 6.1 Update `RoleGuard` to evaluate `activeRole` (not `roles`) when checking route permissions
- [x] 6.2 Verify single-role users are unaffected — no selector shown, guard works as before

## 7. Admin Users Panel

- [x] 7.1 Update `src/services/adminUsers.ts`: replace single-role fetch with `get_user_roles()` call per user (or batch fetch)
- [x] 7.2 Create `admin_assign_user_role` and `admin_revoke_user_role` service functions
- [x] 7.3 Update `src/pages/AdminUsersPage.tsx`: replace single-role dropdown per user row with a checkbox group for each canonical role
- [x] 7.4 Wire checkbox changes to assign/revoke RPCs with optimistic UI update
- [x] 7.5 Verify last-admin lockout error is surfaced to the admin user with Spanish error copy

## 8. Tests

- [x] 8.1 Update `useUser.test.tsx` mocks: replace `role` with `roles` + `activeRole` in all test contexts
- [x] 8.2 Add test: `UserContext` bootstrap with single-role user — `activeRole` set, no selector routing
- [x] 8.3 Add test: `UserContext` bootstrap with multi-role user — `activeRole` null, selector routing triggered
- [x] 8.4 Add test: `setActiveRole` updates `activeRole` in context
- [x] 8.5 Add test: sign-out clears `roles` and `activeRole`
- [x] 8.6 Add test: `RoleGuard` uses `activeRole` for access check
- [x] 8.7 Add test: `RoleSelector` renders a card per role and calls `setActiveRole` on selection
- [x] 8.8 Run full test suite and confirm all 132+ tests pass

## 9. Navigation Cleanup

- [x] 9.1 Update `src/lib/navigation.ts` if `getHomeForRole` or similar uses old `role` field
- [x] 9.2 Update `src/lib/routing.ts` routing policy to use `activeRole`

## 10. Post-Implementation Fixes

Fixes and extensions surfaced after applying the composite PK migration.

- [x] 10.1 Fix `admin_list_staff_members` to filter only users with `role = 'staff'` using EXISTS — prevents duplicate rows from the multi-role composite PK (migration `20260513060000`, corrected in `20260513070000`)
- [x] 10.2 Fix `admin_create_staff_member` `ON CONFLICT` clause: change `ON CONFLICT (user_id)` → `ON CONFLICT (user_id, role) DO NOTHING` to match composite PK (migration `20260513070000`)
- [x] 10.3 Fix `admin_update_staff_member` to return `'staff'::app_role` as fixed column instead of LEFT JOINing `user_roles` (migration `20260513070000`)
- [x] 10.4 Fix `AppShell`: add `<Navigate to="/seleccionar-rol">` redirect for multi-role users with no `activeRole` set, preventing "No se pudo determinar el rol del usuario" error
- [x] 10.5 Add `admin_assign_user_role` auto-creates `staff_members` stub when assigning `staff` role (display_name from profile or email prefix) — prevents users from being invisible in `/admin/staff` (migration `20260513090000`)
- [x] 10.6 Backfill `staff_members` records for all existing `user_roles WHERE role='staff'` users that lacked a record (migration `20260513090000`)

## 11. Staff Self-Service Availability (Extension)

Implemented in this change as an extension to staff UX after multi-role navigation was established.

- [x] 11.1 Add DB RPCs: `get_my_staff_member_id()`, `staff_set_my_schedule(jsonb)`, `staff_upsert_my_exception(...)`, `staff_delete_my_exception(date)` — all `SECURITY DEFINER`, granted to `authenticated` (migration `20260513080000`)
- [x] 11.2 Extend `src/services/staffAvailability.ts` with self-service wrappers calling those RPCs
- [x] 11.3 Create `src/hooks/useMyStaffAvailability.ts` — resolves own `staff_member_id` internally, exposes schedule/exceptions state, save/add/remove actions
- [x] 11.4 Rewrite `src/pages/StaffSchedulePage.tsx` from placeholder to full availability editor using `useMyStaffAvailability`
- [x] 11.5 Rename navigation label `schedule` → `"Disponibilidad"` in `uiCopy.ts`; add new `staffAppointments: 'Agenda'` entry
- [x] 11.6 Update staff navigation in `lib/navigation.ts`: add "Agenda" tab → `/staff/appointments`, rename existing schedule tab → "Disponibilidad"
- [x] 11.7 Add `/staff/appointments` route policy in `lib/routing.ts`
- [x] 11.8 Create `src/pages/StaffAppointmentsPage.tsx` placeholder for future booked appointments view
- [x] 11.9 Register `StaffAppointmentsPage` in `App.tsx` and `src/pages/index.ts`
