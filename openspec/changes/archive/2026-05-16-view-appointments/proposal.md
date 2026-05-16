## Why

Customers and staff currently have no way to view their appointments after booking. The booking confirmation page (#19) is accessible only via direct link — there is no persistent, navigable list of appointments. This item delivers the core appointment visibility experience for both roles, including a calendar view, completing the post-booking loop.

## What Changes

- New `list_appointments()` SECURITY DEFINER RPC: role-aware, returns appointments joined with service, staff, organization, and profile data; hard-limited to 200 rows ordered by `starts_at DESC`
- New `AppointmentsPage` at `/appointments` (customer): tabbed list (Próximos / Historial) with Lista ↔ Calendario view toggle; weekly and monthly calendar modes
- New `StaffAppointmentsPage` at `/staff/appointments` (staff): same structure as customer view but shows customer name instead of staff name
- New `useAppointments` hook: loads appointments from the RPC with loading/error/empty states
- Routes `/appointments` and `/staff/appointments` registered and guarded by role

## Capabilities

### New Capabilities
- `view-appointments`: Customer and staff appointment list with tab filtering (upcoming/history), card display with booking reference and detail link, and read-only calendar UI (weekly + monthly toggle)

### Modified Capabilities
<!-- No existing spec-level requirements are changing -->

## Impact

- **DB**: New `list_appointments()` RPC migration (`supabase/migrations/`)
- **Services**: `src/services/appointments.ts` — new `listAppointments()` function and `AppointmentSummary` interface
- **Hooks**: `src/hooks/useAppointments.ts` — new hook
- **Pages**: `src/pages/AppointmentsPage.tsx` and `src/pages/StaffAppointmentsPage.tsx` — replace stubs
- **Routing**: `src/lib/routing.ts` and `src/App.tsx` — register both routes with RoleGuard
- **Tests**: SQL smoke tests, hook unit tests, page integration tests
- **Dependencies**: `formatSlotTime` (#16), `BookingConfirmationPage` link target (#19), `appointments` table + RLS (#17)
