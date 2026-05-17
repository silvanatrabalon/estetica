## Why

Customers need to change a confirmed or pending appointment to a different time without cancelling and re-booking from scratch. This friction causes unnecessary cancellations and reduces scheduling efficiency for the business. Reschedule as a first-class action (item #21 in the backlog) completes the appointment lifecycle management story that began with booking (#17) and viewing (#20).

## What Changes

- New `reschedule_appointment(p_appointment_id, p_new_starts_at)` SECURITY DEFINER RPC that validates authorization, enforces the booking policy window for customers, recomputes `ends_at` server-side, and atomically updates the appointment — relying on the existing `excl_appointments_staff_no_overlap` exclusion constraint for conflict detection
- New `ReschedulePage` at `/appointments/:id/reschedule` (accessible to `customer`, `staff`, `admin`) that loads the existing appointment, pre-selects the same service, and reuses the `BookingDatePicker` + `SlotGrid` components from #16 for slot selection
- "Reprogramar" CTA added to `AppointmentCard` (entry point from the appointment list in #20)
- `rescheduleAppointment()` service function in `src/services/appointments.ts` with Spanish error translation
- New route registered in `routing.ts` and `App.tsx`

## Capabilities

### New Capabilities

- `reschedule-appointment`: Full reschedule flow — DB RPC with role-aware authorization and policy enforcement, frontend route with reused slot picker, error handling with Spanish copy

### Modified Capabilities

- `view-appointments`: `AppointmentCard` gains a "Reprogramar" CTA for `pending`/`confirmed` appointments (requirement addition — the card now exposes an action, not just a navigation link)

## Impact

- **Database**: new migration for `reschedule_appointment` RPC
- **Service layer**: `src/services/appointments.ts` — new `rescheduleAppointment()` function
- **Components**: `src/components/appointments/AppointmentCard.tsx` — new "Reprogramar" button
- **Pages**: new `src/pages/ReschedulePage.tsx`
- **Routing**: `src/lib/routing.ts` + `src/App.tsx` — new `/appointments/:id/reschedule` route
- **Dependencies**: relies on `get_appointment` (#19), `get_available_slots` (#16), `BookingDatePicker` + `SlotGrid` (#16), `excl_appointments_staff_no_overlap` constraint (#17/18)
