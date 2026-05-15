## Why

Before building the slot generator (#16) and booking flow (#17), the system needs three configurable constraints that define when and how services can be booked: specific date availability for equipment-limited services, concurrent booking capacity per service, and global booking policy windows (minimum notice and maximum horizon). Without these, #16 cannot be correctly specified because its query boundaries and filtering logic depend on them.

## What Changes

- **New table** `service_available_dates`: per-service calendar date whitelist; absence of rows means no restriction; presence of rows restricts the service to only those dates
- **New admin sub-route** `/admin/services/:serviceId/availability`: date picker UI for admins to add/remove specific available dates per service
- **New "Gestionar disponibilidad" action** per service row in `AdminServicesPage`: navigates to the availability management sub-route
- **New column** `services.max_concurrent_bookings` (nullable integer, ≥1): caps how many overlapping bookings a service can have at any given slot
- **Capacity field** added to the service create/edit form in `AdminServicesPage`
- **New columns** `organizations.booking_min_notice_minutes` (default 60) and `organizations.booking_max_horizon_days` (default 60): define the global booking window for the business
- **New "Configuración de reservas" section** in the Business Settings admin page exposing the two policy columns
- **Three admin RPCs** for `service_available_dates` mutations (list, add, remove); all SECURITY DEFINER, admin-only
- **Two database migrations**: one for the new table + column alterations + grants + RLS; one for the admin RPCs

## Capabilities

### New Capabilities

- `service-booking-configuration`: Full configuration surface for the three booking constraints — per-service date whitelist (15a), per-service capacity limit (15b), and global booking policy window (15c)

### Modified Capabilities

- `services-catalog-admin`: Admin service create/edit form gains a new `max_concurrent_bookings` field; service list gains a "Gestionar disponibilidad" action link
- `business-settings-profile`: Business Settings page gains a new "Configuración de reservas" section with `booking_min_notice_minutes` and `booking_max_horizon_days` fields

## Impact

- **Database**: New table `service_available_dates`; `ALTER TABLE services` adds `max_concurrent_bookings`; `ALTER TABLE organizations` adds two booking policy columns
- **Migrations**: Two new migration files following the established `_tables_grants_rls` + `_admin_rpcs` two-migration pattern
- **Service layer**: New `src/services/adminServiceAvailability.ts` (RPCs for date management); `src/services/adminServices.ts` updated to include `maxConcurrentBookings` in service type and RPC wrappers; `src/services/adminBusiness.ts` (or equivalent) updated to include the two new policy fields
- **Pages**: New `src/pages/AdminServiceAvailabilityPage.tsx`; `src/pages/AdminServicesPage.tsx` updated (capacity field + availability link); `src/pages/BusinessSettingsPage.tsx` updated (new section)
- **Routing**: New route entry `/admin/services/:serviceId/availability` in `src/lib/routing.ts` and `src/App.tsx`
- **Downstream**: #16 (slot generator) and #17 (booking flow) read all three constraints — no changes to them in this item
