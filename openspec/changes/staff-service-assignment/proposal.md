## Why

The booking flow (#16) requires knowing which staff members can perform each service — not all practitioners offer the same services. Without a staff–service assignment table, the slot generator cannot filter eligible staff by service, making correct booking impossible.

## What Changes

- New junction table `staff_services` linking `staff_members` to `services`
- 4 new SECURITY DEFINER RPC functions for admin-only assignment management
- New admin sub-route `/admin/staff/:staffId/services` with assignment panel
- `AdminStaffPage` gains a "Gestionar servicios" link per staff row (alongside the existing availability link)
- New TypeScript service layer `src/services/adminStaffServices.ts` with typed interfaces and camelCase mappers
- New `AdminStaffServicesPage` component with full assign/unassign UX

## Capabilities

### New Capabilities
- `staff-service-assignment`: Admin-managed junction between staff members and services; admin assigns/unassigns active services per staff member via a dedicated sub-route; enables booking flow to filter eligible staff by service

### Modified Capabilities
- `staff-professionals-management`: Admin staff list gains a "Gestionar servicios" action link per row, pointing to the new sub-route

## Impact

- **Database**: New migration adds `staff_services` table with composite PK, FKs with ON DELETE CASCADE, indexes, RLS policy (SELECT to authenticated), and 4 admin RPC functions
- **Backend**: 4 SECURITY DEFINER functions — `admin_list_staff_services`, `admin_list_assignable_services`, `admin_assign_service_to_staff`, `admin_unassign_service_from_staff`
- **Frontend**: New page `AdminStaffServicesPage`, new service file `adminStaffServices.ts`, route added to routing config, link added to `AdminStaffPage`
- **No breaking changes** to existing services, staff management, or availability features
