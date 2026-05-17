## Why

Customers and staff need a way to cancel appointments they can no longer attend. Without a cancellation flow, customers are blocked from managing their own bookings, and staff cannot action no-show or unwanted appointments — leaving the schedule polluted with stale confirmed entries.

## What Changes

- New `cancel_appointment(p_appointment_id uuid)` SECURITY DEFINER RPC: validates authorization (customer/staff/admin), enforces a status guard (`pending`/`confirmed` only), applies a booking policy window for customer callers, and atomically sets `status = 'cancelled'`.
- `AppointmentCard` gains a "Cancelar" button that opens an inline confirmation dialog — no new route required.
- `AppointmentsPage` and `StaffAppointmentsPage` handle optimistic status updates and render the "Cancelado" badge in the **Historial** tab after cancellation.
- `cancelAppointment()` TypeScript service function added to `src/services/appointments.ts` with Spanish error translation.

## Capabilities

### New Capabilities
- `cancel-appointment`: Server-side RPC and frontend confirmation dialog flow for cancelling `pending`/`confirmed` appointments by authorized callers (customer own, staff assigned, admin any), with policy window enforcement for customers.

### Modified Capabilities
- `view-appointments`: Appointment cards in `AppointmentsPage` and `StaffAppointmentsPage` gain a "Cancelar" CTA for upcoming appointments; cancelled appointments remain visible in **Historial** with a "Cancelado" badge.

## Impact

- **DB**: New migration adding `cancel_appointment` SECURITY DEFINER function; no schema changes (status enum value `cancelled` already exists).
- **Service layer**: `src/services/appointments.ts` — new `cancelAppointment()` function and error constants.
- **Components**: `AppointmentCard` — new "Cancelar" button + `CancelDialog` component; `AppointmentsPage` / `StaffAppointmentsPage` — status update after cancellation.
- **Dependencies**: Requires #20 (`AppointmentsPage` + `AppointmentCard`) and #17 (`appointments` UPDATE RLS, `booking_min_notice_minutes`).
- **No new routes** — dialog is inline on the appointments list.
