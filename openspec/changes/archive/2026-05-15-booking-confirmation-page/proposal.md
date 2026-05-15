## Why

After a customer successfully books an appointment, the app navigates to `/booking/confirmation/:appointmentId` but only shows a stub. Customers need a full confirmation experience — appointment details, a booking reference, and clear next-step navigation — to trust that their booking was received and know what to do next.

## What Changes

- New `get_appointment` SECURITY DEFINER RPC that returns a joined appointment row (service, staff, org) with safe authorization: returns empty result (not error) when the caller is not the owner or staff/admin, preventing ID enumeration
- `BookingConfirmationPage.tsx` replaces the existing stub at `/booking/confirmation/:appointmentId` with a complete implementation covering loading, success, not-found, and error states
- `getAppointment()` function and `AppointmentDetail` interface added to `src/services/appointments.ts`
- Unit tests for the page (all states) and smoke tests for the RPC

## Capabilities

### New Capabilities
- `booking-confirmation`: Post-booking confirmation page — fetches appointment details by ID from route param, displays service name, formatted date/time in org timezone, staff display name, business name, status badge, booking reference, and CTAs to appointments list and booking flow

### Modified Capabilities
<!-- No existing spec-level behavior is changing. appointment-booking already registered the route stub and appointments SELECT RLS. -->

## Impact

- **DB**: New `get_appointment` RPC function (Supabase migration)
- **Frontend**: `src/pages/BookingConfirmationPage.tsx` — full implementation replacing stub
- **Services**: `src/services/appointments.ts` — new `getAppointment()` function and `AppointmentDetail` interface
- **Dependencies**: `formatSlotTime` from `src/services/availability.ts` (#16); route already registered in `routing.ts` and `App.tsx` (#17)
- **No new tables**, no new routes, no new auth flows
