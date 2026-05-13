## Why

The booking flow requires knowing when each staff member is available. Without per-staff availability data, the slot generator (#16) can only use business-wide hours, which prevents correctly filtering available time slots by staff member. This capability must be in place before services can be assigned to staff and before the booking flow can be built.

## What Changes

- New admin route `/admin/staff/:staffId/availability` accessible from the staff directory
- New `staff_schedules` table: recurring weekly availability template per staff member (one row per weekday, mirrors `business_hours` structure)
- New `staff_schedule_exceptions` table: one-off date overrides per staff member (`day_off` or `custom_hours`)
- Three new admin-only SECURITY DEFINER RPC functions for all mutations
- New frontend page `StaffAvailabilityPage` with weekly schedule editor and exception date manager
- New service `staffAvailability.ts` and hook `useStaffAvailability`
- All UI copy in Spanish

## Capabilities

### New Capabilities
- `staff-availability-configuration`: Admin-only configuration of each staff member's recurring weekly availability template and one-off exception dates. Weekly template repeats indefinitely until changed. Exception dates override the weekly template for a specific date only. Feeds the slot generator for per-staff booking availability.

### Modified Capabilities
- `protected-routes-and-role-guards`: New admin-only route `/admin/staff/:staffId/availability` added to the route access matrix
- `supabase-schema-foundation`: New tables `staff_schedules` and `staff_schedule_exceptions` extend the foundation schema
- `supabase-rls-access-control`: RLS policies for new tables (authenticated SELECT, write-only via SECURITY DEFINER RPCs)

## Impact

- **New DB tables**: `staff_schedules`, `staff_schedule_exceptions` (two new migrations)
- **New RPC functions**: `admin_set_staff_schedule`, `admin_upsert_staff_schedule_exception`, `admin_delete_staff_schedule_exception`
- **New frontend files**: `src/pages/StaffAvailabilityPage.tsx`, `src/services/staffAvailability.ts`, `src/hooks/useStaffAvailability.ts`, supporting components
- **Modified**: `src/lib/navigation.ts` (admin nav), `src/App.tsx` (new route), `AdminStaffPage` (add "Disponibilidad" action button)
- **Slot generator dependency**: Feature #16 will read `staff_schedules` and `staff_schedule_exceptions` to compute available slots
