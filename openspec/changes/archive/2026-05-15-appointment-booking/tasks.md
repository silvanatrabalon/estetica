## 1. Database: Extension, RLS, and Constraint

- [x] 1.1 Add migration: `CREATE EXTENSION IF NOT EXISTS btree_gist`
- [x] 1.2 Add migration: `GRANT SELECT ON public.appointments TO authenticated`
- [x] 1.3 Add migration: customer SELECT RLS policy (`customer_user_id = auth.uid()`)
- [x] 1.4 Add migration: staff/admin SELECT RLS policy (`is_staff_or_admin() AND organization_id = singleton org`)
- [x] 1.5 Add migration: `DROP INDEX IF EXISTS ux_appointments_staff_exact_slot`
- [x] 1.6 Add migration: `ADD CONSTRAINT excl_appointments_staff_no_overlap` using GIST on `(staff_member_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)` WHERE `status IN ('pending', 'confirmed')`
- [x] 1.7 Add supporting index for the exclusion constraint if needed
- [x] 1.8 Apply migration to remote Supabase instance and verify

## 2. Database: `create_appointment` RPC

- [x] 2.1 Add migration: `CREATE OR REPLACE FUNCTION create_appointment(p_service_id uuid, p_starts_at timestamptz)` with `SECURITY DEFINER`
- [x] 2.2 Implement service existence and `is_active` check; raise `BOOKING_SERVICE_NOT_FOUND`
- [x] 2.3 Implement booking policy window check using `organizations.booking_min_notice_minutes` and `booking_max_horizon_days`; raise `BOOKING_OUTSIDE_POLICY_WINDOW`
- [x] 2.4 Compute `p_ends_at := p_starts_at + (service.duration_minutes * interval '1 minute')`
- [x] 2.5 Implement `max_concurrent_bookings` capacity check; raise `BOOKING_CAPACITY_EXCEEDED`
- [x] 2.6 Implement staff auto-assignment: first active staff assigned to service with no overlap, ordered by `staff_members.created_at ASC`; raise `BOOKING_NO_STAFF_AVAILABLE`
- [x] 2.7 INSERT appointment with `status = 'confirmed'`, `customer_user_id = auth.uid()`, `created_by_user_id = auth.uid()`
- [x] 2.8 Return `id, service_id, staff_member_id, starts_at, ends_at, status, created_at`
- [x] 2.9 `GRANT EXECUTE ON FUNCTION create_appointment TO authenticated`
- [x] 2.10 Apply migration to remote Supabase instance and verify RPC executes correctly

## 3. Database: SQL Smoke Tests

- [x] 3.1 Add `supabase/tests/appointment_booking.sql` with smoke test for successful booking → `status = 'confirmed'`
- [x] 3.2 Smoke test: `ends_at = starts_at + duration_minutes`
- [x] 3.3 Smoke test: unauthenticated call denied
- [x] 3.4 Smoke test: `BOOKING_NO_STAFF_AVAILABLE` raised when all staff are blocked
- [x] 3.5 Smoke test: `BOOKING_CAPACITY_EXCEEDED` raised when at capacity
- [x] 3.6 Smoke test: `BOOKING_OUTSIDE_POLICY_WINDOW` raised for out-of-window slot
- [x] 3.7 Smoke test: customer SELECT returns own appointment only
- [x] 3.8 Smoke test: staff/admin SELECT returns all org appointments
- [x] 3.9 Smoke test: exclusion constraint blocks overlapping booking
- [x] 3.10 Smoke test: back-to-back booking succeeds (half-open interval)
- [x] 3.11 Smoke test: cancelled appointment does not block new booking
- [x] 3.12 Smoke test: two different staff can have overlapping appointments
- [x] 3.13 Smoke test: null `max_concurrent_bookings` skips capacity check

## 4. TypeScript: `src/services/appointments.ts`

- [x] 4.1 Create `src/services/appointments.ts` with `NewAppointment` interface (camelCase keys)
- [x] 4.2 Implement `createAppointment(params: { serviceId: string; startsAt: string }): Promise<NewAppointment>`
- [x] 4.3 Implement `isConflictError(err: unknown): boolean` detecting `23P01`, `23505`, and `P0001` booking messages
- [x] 4.4 Map `23P01` → "El horario seleccionado ya no está disponible. Por favor, seleccioná otro turno."
- [x] 4.5 Map `P0001:BOOKING_NO_STAFF_AVAILABLE` → "El horario seleccionado ya no está disponible. Por favor, seleccioná otro turno."
- [x] 4.6 Map `P0001:BOOKING_CAPACITY_EXCEEDED` → "El turno seleccionado ya no tiene disponibilidad. Por favor, elegí otro."
- [x] 4.7 Map `P0001:BOOKING_OUTSIDE_POLICY_WINDOW` → "Este horario ya no está dentro del rango de reservas permitido."
- [x] 4.8 Map `P0001:BOOKING_SERVICE_NOT_FOUND` → "El servicio seleccionado no está disponible."
- [x] 4.9 Export `createAppointment` and `isConflictError` from `src/services/index.ts`

## 5. TypeScript: Unit Tests for `appointments.ts`

- [x] 5.1 Create `src/services/appointments.test.ts`
- [x] 5.2 Test: `createAppointment` maps RPC response to `NewAppointment`
- [x] 5.3 Test: `isConflictError` returns true for `23P01`
- [x] 5.4 Test: `isConflictError` returns true for `23505`
- [x] 5.5 Test: `isConflictError` returns true for `P0001` with booking message
- [x] 5.6 Test: `isConflictError` returns false for unrelated errors
- [x] 5.7 Test: error code `23P01` throws Spanish message
- [x] 5.8 Test: `BOOKING_NO_STAFF_AVAILABLE` throws Spanish message
- [x] 5.9 Test: `BOOKING_CAPACITY_EXCEEDED` throws Spanish message
- [x] 5.10 Test: `BOOKING_OUTSIDE_POLICY_WINDOW` throws Spanish message
- [x] 5.11 Test: `BOOKING_SERVICE_NOT_FOUND` throws Spanish message

## 6. Frontend: Routing

- [x] 6.1 Add `/booking/confirmation/:appointmentId` route to `routePolicies` in `src/lib/routing.ts` as `role-restricted` with `allowedRoles: ['customer']`
- [x] 6.2 Add routing test: `getRoutePolicy('/booking/confirmation/some-id')` returns correct policy
- [x] 6.3 Register a stub `BookingConfirmationPage` in `src/App.tsx` for the new route
- [x] 6.4 Create stub `src/pages/BookingConfirmationPage.tsx` (placeholder UI, Spanish heading)
- [x] 6.5 Export stub page from `src/pages/index.ts`

## 7. Frontend: BookingPage Step 4

- [x] 7.1 Add Step 4 state to `BookingPage.tsx` (review + confirm)
- [x] 7.2 Render Step 4 with service name, formatted date/time (org timezone via `formatSlotTime`), duration in minutes, price formatted in pesos
- [x] 7.3 Add "Volver" back button that returns user to Step 3
- [x] 7.4 Add "Confirmar reserva" primary CTA that calls `createAppointment`
- [x] 7.5 On success, call `navigate('/booking/confirmation/' + appointment.id)`
- [x] 7.6 On conflict/no-staff error (`isConflictError`), display inline Spanish error message
- [x] 7.7 On conflict error, render "Elegir otro turno" button that returns user to Step 3
- [x] 7.8 Show loading state on "Confirmar reserva" while RPC is in flight

## 8. Frontend: Integration Tests for BookingPage Step 4

- [x] 8.1 Add test: Step 4 renders service name, date/time, duration, price
- [x] 8.2 Add test: "Confirmar reserva" calls `createAppointment` with correct params
- [x] 8.3 Add test: successful booking navigates to `/booking/confirmation/:id`
- [x] 8.4 Add test: conflict error shows inline Spanish message
- [x] 8.5 Add test: "Elegir otro turno" CTA returns user to Step 3

## 9. Verification

- [x] 9.1 Run `vitest run` — all tests pass (no regressions)
- [x] 9.2 Manual E2E: complete booking flow from Step 1 → Step 4 → confirmation navigation
- [x] 9.3 Manual E2E: trigger conflict scenario; verify inline Spanish error and back CTA
- [x] 9.4 Update `BACKLOG.md` — mark `appointment-booking` tasks done under #17 and #18
