## Why

Admins have no dedicated view to browse and filter all organization appointments. The existing `/admin/reports` route is reserved for analytics and KPIs (#26); a separate operational list is needed so admins can monitor daily activity, diagnose booking issues, and manage appointment state without building analytics first.

## What Changes

- New SECURITY DEFINER RPC `admin_list_appointments` with server-side filtering by status and date range, offset pagination, and a `total_count` return for UI pagination controls
- New `AdminAppointmentsPage` at `/admin/appointments` with a table/list layout, status multi-select filter chips, date range inputs, and previous/next pagination
- Navigation link added to the admin sidebar/nav pointing to `/admin/appointments`
- New route registered in `App.tsx` under `RoleGuard allowedRoles={['admin']}`
- New TypeScript service layer in `src/services/adminAppointments.ts` with typed interfaces and camelCase mappers

## Capabilities

### New Capabilities
- `admin-view-appointments`: Admin can list, filter by status and date range, and paginate all organization appointments via a dedicated `/admin/appointments` page backed by a SECURITY DEFINER RPC

### Modified Capabilities
<!-- No existing spec-level requirements change — this is a net-new admin capability -->

## Impact

- **DB**: New `admin_list_appointments` SECURITY DEFINER function; no table or schema changes
- **Frontend**: New `AdminAppointmentsPage.tsx`, new `src/services/adminAppointments.ts`; `App.tsx` and admin navigation updated
- **Dependencies**: `appointments` table + `profiles`, `services`, `staff_members` (all exist); `is_admin()` helper (exists); `AppointmentSummary` TypeScript interface (reused from #20 `useAppointments`)
- **No breaking changes** — additive only; existing routes and RLS policies untouched
