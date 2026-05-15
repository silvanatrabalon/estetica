## 1. Database Migration — Table, Grants & RLS

- [x] 1.1 Create migration `supabase/migrations/YYYYMMDDHHMMSS_staff_services_tables_grants_rls.sql`: create `staff_services` table with composite PK `(staff_member_id, service_id)`, FKs with ON DELETE CASCADE to `staff_members`, `services`, and `organizations`, `created_at` timestamptz default now()
- [x] 1.2 Add index on `(service_id, staff_member_id)` for booking flow reads
- [x] 1.3 Add index on `(staff_member_id)` for admin panel reads
- [x] 1.4 Grant SELECT on `staff_services` to `authenticated`
- [x] 1.5 Enable RLS on `staff_services` and create SELECT policy allowing all authenticated users

## 2. Database Migration — Admin RPC Functions

- [x] 2.1 Create migration `supabase/migrations/YYYYMMDDHHMMSS_staff_services_admin_rpcs.sql`
- [x] 2.2 Implement `admin_list_staff_services(p_staff_member_id uuid)` — returns service rows currently assigned to the staff member; SECURITY DEFINER with `is_admin()` guard
- [x] 2.3 Implement `admin_list_assignable_services(p_staff_member_id uuid)` — returns active services NOT yet assigned to the staff member; SECURITY DEFINER with `is_admin()` guard
- [x] 2.4 Implement `admin_assign_service_to_staff(p_staff_member_id uuid, p_service_id uuid)` — inserts junction row, populates `organization_id` from the staff member's org; SECURITY DEFINER with `is_admin()` guard
- [x] 2.5 Implement `admin_unassign_service_from_staff(p_staff_member_id uuid, p_service_id uuid)` — hard deletes junction row; SECURITY DEFINER with `is_admin()` guard
- [x] 2.6 Grant EXECUTE on all 4 functions to `authenticated`
- [x] 2.7 Apply migrations to remote: `npx supabase db push`

## 3. Service Layer

- [x] 3.1 Create `src/services/adminStaffServices.ts` with `StaffService` interface (camelCase: `serviceId`, `staffMemberId`, `name`, `durationMinutes`, `priceCents`, `imageUrl`, `isActive`, `createdAt`)
- [x] 3.2 Implement `listStaffServices(staffMemberId: string): Promise<StaffService[]>` — calls `admin_list_staff_services`, maps snake→camelCase
- [x] 3.3 Implement `listAssignableServices(staffMemberId: string): Promise<StaffService[]>` — calls `admin_list_assignable_services`, maps snake→camelCase
- [x] 3.4 Implement `assignServiceToStaff(staffMemberId: string, serviceId: string): Promise<void>` — calls `admin_assign_service_to_staff`
- [x] 3.5 Implement `unassignServiceFromStaff(staffMemberId: string, serviceId: string): Promise<void>` — calls `admin_unassign_service_from_staff`
- [x] 3.6 Add `export * from './adminStaffServices'` to `src/services/index.ts`

## 4. Page Component — AdminStaffServicesPage

- [x] 4.1 Create `src/pages/AdminStaffServicesPage.tsx` — reads `staffId` from `useParams()`
- [x] 4.2 On mount: load assigned services (listStaffServices) and assignable services (listAssignableServices); show loading state "Cargando servicios..." while fetching
- [x] 4.3 Render assigned services list: table with service name, duration, price (ARS), and a "Quitar" button per row
- [x] 4.4 Empty state for no assignments: "Este profesional no tiene servicios asignados todavía."
- [x] 4.5 Render assignable services selector: `<select>` dropdown of unassigned active services + "Asignar" button
- [x] 4.6 Empty selector state (all active services already assigned): "Todos los servicios activos ya están asignados."
- [x] 4.7 Assign action: call `assignServiceToStaff`, refresh both lists, show success message "Servicio asignado correctamente."
- [x] 4.8 Unassign action: call `unassignServiceFromStaff`, refresh both lists, show success message "Servicio quitado correctamente."
- [x] 4.9 Error states: display Spanish error message on any RPC failure; error on load: "No pudimos cargar los servicios en este momento."
- [x] 4.10 Add `AdminStaffServicesPage` export to `src/pages/index.ts`

## 5. Routing & Navigation

- [x] 5.1 Add route entry in `src/lib/routing.ts`: `{ path: '/admin/staff/:staffId/services', access: 'role-restricted', allowedRoles: ['admin'] }`
- [x] 5.2 Add `<Route path="/admin/staff/:staffId/services" element={<AdminStaffServicesPage />} />` inside the admin route group in `src/App.tsx`
- [x] 5.3 Import `AdminStaffServicesPage` in `src/App.tsx`
- [x] 5.4 Add "Gestionar servicios" link per staff row in `AdminStaffPage` pointing to `/admin/staff/${staffMember.id}/services`, alongside the existing "Gestionar disponibilidad" link

## 6. Tests — Service Layer Unit Tests

- [x] 6.1 Create `src/services/adminStaffServices.test.ts`
- [x] 6.2 Test `listStaffServices`: verify RPC called with correct `staffMemberId` param; verify camelCase mapping of returned rows
- [x] 6.3 Test `listAssignableServices`: verify RPC called with correct `staffMemberId` param; verify camelCase mapping
- [x] 6.4 Test `assignServiceToStaff`: verify RPC called with correct `staffMemberId` and `serviceId` params
- [x] 6.5 Test `unassignServiceFromStaff`: verify RPC called with correct `staffMemberId` and `serviceId` params

## 7. Tests — Integration Tests

- [x] 7.1 Create `src/pages/AdminStaffServicesPage.test.tsx`; mock `../services/adminStaffServices`; render with `TestUserProvider` (admin role) in `MemoryRouter` with staffId param
- [x] 7.2 Test: loading state is shown while RPC resolves
- [x] 7.3 Test: empty assignments state shows Spanish empty message when listStaffServices returns []
- [x] 7.4 Test: empty assignable services state shows Spanish message when listAssignableServices returns []
- [x] 7.5 Test: assigned services list renders rows with service name and "Quitar" button
- [x] 7.6 Test: clicking "Asignar" calls `assignServiceToStaff` with correct params and shows success message
- [x] 7.7 Test: clicking "Quitar" calls `unassignServiceFromStaff` with correct params and removes the row from the list
- [x] 7.8 Test: RPC error on load shows Spanish error message

## 8. Tests — RLS Smoke Tests

- [x] 8.1 Add RLS smoke test cases to `supabase/tests/` (or existing RLS test file): authenticated non-admin can SELECT from `staff_services`
- [x] 8.2 Test: non-admin direct INSERT on `staff_services` is rejected by RLS
- [x] 8.3 Test: non-admin direct DELETE on `staff_services` is rejected by RLS
- [x] 8.4 Test: admin calling `admin_assign_service_to_staff` succeeds
- [x] 8.5 Test: non-admin calling `admin_assign_service_to_staff` raises "No autorizado"

## 9. Final Verification

- [x] 9.1 Run full test suite (`npm run test`) — all tests passing
- [x] 9.2 Manual smoke test: navigate to `/admin/staff/:staffId/services`, assign a service, verify it appears in list, unassign it, verify it disappears
- [x] 9.3 Verify "Gestionar servicios" link appears in `AdminStaffPage` staff rows and navigates correctly
