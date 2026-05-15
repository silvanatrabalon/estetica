## Why

The booking system has all prerequisite data configured (staff schedules, service assignments, business hours, booking policies) but no mechanism to compute which time slots are actually bookable. Without a slot generator, customers cannot see or choose available appointments. This is the missing bridge between configuration and the booking flow.

## What Changes

- New SECURITY DEFINER PostgreSQL function `get_available_slots(p_service_id uuid, p_date date)` that returns available `(starts_at, ends_at)` UTC pairs
- The function aggregates availability across all active staff assigned to the service (any-staff model — no staff selection by the customer)
- Slot generation pipeline: staff schedule resolution → business hours intersection → UTC conversion → 30-minute candidate loop → overlap exclusion → capacity cap → policy window filter
- New TypeScript service layer: `src/services/availability.ts` with `getAvailableSlots()` and `AvailableSlot` type
- New React hooks: `useAvailableSlots(serviceId, date)` and `useActiveServices()`
- Frontend `formatSlotTime(isoUtc, orgTimezone)` utility using `Intl.DateTimeFormat` (no third-party date library)
- `/booking` route implemented as a 3-step customer wizard: service selector → date picker → slot grid

## Capabilities

### New Capabilities

- `availability-slot-generation`: PostgreSQL slot generator RPC, TypeScript service layer, hooks, and the 3-step customer booking wizard (slot selection only — booking creation is #17)

### Modified Capabilities

- `service-booking-configuration`: The slot generator reads `service_available_dates` (date whitelist), `services.max_concurrent_bookings` (capacity cap), and `organizations.booking_min_notice_minutes` / `booking_max_horizon_days` (policy window). These constraints are now actively enforced by the generator, not just stored.

## Impact

- **New DB function**: `get_available_slots` (SECURITY DEFINER, granted to `authenticated`)
- **No new tables**: relies entirely on existing schema from #10, #12, #14b, #15
- **New files**: `src/services/availability.ts`, `src/hooks/useAvailableSlots.ts`, `src/hooks/useActiveServices.ts`, `src/lib/formatSlotTime.ts`
- **Modified files**: `src/pages/BookingPage.tsx` (replace stub), `src/lib/index.ts` (re-export formatter)
- **New SQL test file**: `supabase/tests/availability_slot_generation.sql`
- **Dependencies already migrated**: `staff_schedules`, `staff_schedule_exceptions`, `business_hours`, `business_closure_exceptions`, `service_available_dates`, `staff_services`, `appointments`, `organizations.booking_min_notice_minutes`, `organizations.booking_max_horizon_days`, `services.max_concurrent_bookings`
