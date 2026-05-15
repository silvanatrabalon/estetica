## Why

Users can currently browse services, select a date, and see available time slots — but cannot complete a booking. This change closes the core conversion loop by allowing customers to confirm an appointment, and establishes the server-side booking logic (conflict prevention, staff auto-assignment, capacity enforcement) required for all future scheduling features.

## What Changes

- New `appointments` table grants and RLS policies scoped to customer, staff, and admin roles
- **BREAKING**: Replace `ux_appointments_staff_exact_slot` unique index with a GIST exclusion constraint (`excl_appointments_staff_no_overlap`) that enforces half-open interval `[)` semantics — back-to-back bookings allowed; only `pending`/`confirmed` statuses block slots
- New `create_appointment` SECURITY DEFINER RPC that validates the booking policy window, enforces `max_concurrent_bookings`, auto-assigns the first available staff member, computes `ends_at` server-side, and inserts with `status = 'confirmed'`
- New `src/services/appointments.ts` with `createAppointment()` function and typed Spanish error translations for all known error codes
- `BookingPage` extended with Step 4 (review + confirm screen) and success routing to `/booking/confirmation/:appointmentId`

## Capabilities

### New Capabilities

- `appointment-booking`: End-to-end booking flow — RLS policies, exclusion constraint, `create_appointment` RPC, TypeScript service layer, and BookingPage Step 4 with confirmation routing

### Modified Capabilities

- `availability-slot-generation`: No requirement changes. Slot generation logic is unchanged; this change only consumes its output (selected slot passed into `create_appointment`).

## Impact

- **Database**: `btree_gist` extension; drop `ux_appointments_staff_exact_slot`; add `excl_appointments_staff_no_overlap`; new `create_appointment` function; `appointments` RLS policies
- **Frontend**: `src/services/appointments.ts` (new); `src/pages/BookingPage.tsx` (Step 4 added); `src/lib/routing.ts` (new route); `src/App.tsx` (stub route registration)
- **Dependencies**: Requires #16 (availability slots), #15 (services catalog), #14b (staff-service assignment)
- **Out of scope**: Confirmation page UI (#19), email notifications (#27), admin appointment views (#20/#23), cancellation (#22), rescheduling (#21)
