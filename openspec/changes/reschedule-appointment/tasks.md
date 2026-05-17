## 1. Database Migration — reschedule_appointment RPC

- [x] 1.1 Create migration file `supabase/migrations/YYYYMMDD_reschedule_appointment_rpc.sql`
- [x] 1.2 Implement `reschedule_appointment(p_appointment_id uuid, p_new_starts_at timestamptz)` SECURITY DEFINER function: look up appointment, verify authorization by role (`customer_user_id = auth.uid()` / staff / admin), raise `RESCHEDULE_NOT_AUTHORIZED` if unauthorized
- [x] 1.3 Add status guard: raise `RESCHEDULE_INVALID_STATUS` if appointment status is not `pending` or `confirmed`
- [x] 1.4 Add policy window check for customer callers: raise `RESCHEDULE_OUTSIDE_POLICY_WINDOW` if `p_new_starts_at < now() + booking_min_notice_minutes`; staff/admin bypass this check
- [x] 1.5 Compute `ends_at = p_new_starts_at + service.duration_minutes * interval '1 minute'` server-side
- [x] 1.6 Atomically UPDATE `starts_at`, `ends_at`, `updated_at = now()` in one statement; add `-- TODO(#27): trigger reschedule notification` comment after the UPDATE
- [x] 1.7 GRANT EXECUTE on `reschedule_appointment` to `authenticated`
- [x] 1.8 Apply migration: `npx supabase db push`

## 2. SQL Smoke Tests

- [x] 2.1 Add smoke test section in `supabase/tests/` for `reschedule_appointment`: customer reschedules own confirmed appointment — returns updated row with new `starts_at` and correct `ends_at`
- [x] 2.2 Test: customer cannot reschedule another customer's appointment — raises `RESCHEDULE_NOT_AUTHORIZED`
- [x] 2.3 Test: policy window rejects too-soon slot for customer — raises `RESCHEDULE_OUTSIDE_POLICY_WINDOW`
- [x] 2.4 Test: staff bypasses policy window — succeeds with slot within customer policy window
- [x] 2.5 Test: admin reschedules any appointment — succeeds
- [x] 2.6 Test: exclusion constraint blocks conflicting slot — UPDATE rejected with `23P01`
- [x] 2.7 Test: `ends_at` equals `new_starts_at + duration_minutes` after reschedule
- [x] 2.8 Test: cannot reschedule `cancelled` appointment — raises `RESCHEDULE_INVALID_STATUS`
- [x] 2.9 Test: cannot reschedule `completed` appointment — raises `RESCHEDULE_INVALID_STATUS`

## 3. Service Layer

- [x] 3.1 Add `RescheduledAppointment` interface to `src/services/appointments.ts` (camelCase fields: `id`, `serviceId`, `staffMemberId`, `startsAt`, `endsAt`, `status`, `updatedAt`)
- [x] 3.2 Add `RescheduleAppointmentRow` interface (snake_case DB row)
- [x] 3.3 Extend RESCHEDULE error constants in `appointments.ts`: `RESCHEDULE_OUTSIDE_POLICY_WINDOW`, `RESCHEDULE_INVALID_STATUS`, `RESCHEDULE_NOT_AUTHORIZED`
- [x] 3.4 Add `translateRescheduleError(err)` function: maps `23P01` → conflict copy, `P0001:RESCHEDULE_*` → respective Spanish messages, fallback → generic Spanish error
- [x] 3.5 Implement `rescheduleAppointment(params: { appointmentId: string; newStartsAt: string }): Promise<RescheduledAppointment>` — calls `reschedule_appointment` RPC, maps row to interface, calls `translateRescheduleError` on error

## 4. Routing

- [x] 4.1 Add `/appointments/:id/reschedule` policy to `routePolicies` in `src/lib/routing.ts` with `access: 'role-restricted'` and `allowedRoles: ['customer', 'staff', 'admin']` — insert before the base `/appointments` entry to ensure correct precedence
- [x] 4.2 Add `ReschedulePage` import and `<Route path="/appointments/:id/reschedule" element={...} />` in `src/App.tsx` under the appropriate RoleGuard

## 5. AppointmentCard — "Reprogramar" CTA

- [x] 5.1 Add a `showRescheduleAction` prop (or derive from status + role) to `AppointmentCard` in `src/components/appointments/AppointmentCard.tsx`
- [x] 5.2 Render a "Reprogramar" `<Link>` to `/appointments/:id/reschedule` on the card when the appointment status is `pending` or `confirmed` and `showRescheduleAction` is true
- [x] 5.3 Ensure the "Reprogramar" link does not propagate the click to the card's outer `<Link>` (stop propagation or restructure to avoid nested anchor)
- [x] 5.4 Pass `showRescheduleAction={true}` from `AppointmentsPage` for upcoming (Próximos) appointments
- [x] 5.5 Pass `showRescheduleAction={true}` from `StaffAppointmentsPage` for upcoming (Próximos) appointments

## 6. ReschedulePage

- [x] 6.1 Create `src/pages/ReschedulePage.tsx`
- [x] 6.2 On mount: read `:id` from route params, call `getAppointment(id)`; render Spanish loading state ("Cargando turno...") while fetching
- [x] 6.3 If `getAppointment` returns null or throws: render Spanish not-found / error state ("No encontramos este turno." / "Ocurrió un error al cargar el turno.")
- [x] 6.4 Render slot picker step: display loaded service name and current slot; use `BookingDatePicker` + `SlotGrid` pre-seeded with `appointment.serviceId` and `appointment.startsAt`
- [x] 6.5 On slot selection: show confirmation step (new date/time + service name) with "Confirmar reprogramación" CTA and back button
- [x] 6.6 On confirm: call `rescheduleAppointment({ appointmentId: id, newStartsAt: selectedSlot })`; show loading state ("Reprogramando turno...")
- [x] 6.7 On success: `navigate('/booking/confirmation/:id')`
- [x] 6.8 On conflict or policy window error: display inline Spanish error message + "Elegir otro turno" CTA that resets to slot picker step
- [x] 6.9 Export `ReschedulePage` from `src/pages/index.ts`

## 7. Tests

- [x] 7.1 Add unit tests for `rescheduleAppointment()` in `src/services/appointments.test.ts` (or new file): maps RPC response to `RescheduledAppointment`; `23P01` → correct Spanish conflict message; `P0001:RESCHEDULE_OUTSIDE_POLICY_WINDOW` → policy copy; `P0001:RESCHEDULE_INVALID_STATUS` → status copy; `P0001:RESCHEDULE_NOT_AUTHORIZED` → auth copy
- [x] 7.2 Create `src/pages/ReschedulePage.test.tsx`: loading state renders Spanish spinner; not-found state renders Spanish error; slot picker renders with pre-selected service name; success navigates to `/booking/confirmation/:id`; conflict error renders inline with "Elegir otro turno" CTA; policy window error renders inline with correct copy
- [x] 7.3 Update `AppointmentCard` tests (or `AppointmentsPage` tests): "Reprogramar" CTA visible on `pending`/`confirmed` cards when `showRescheduleAction=true`; CTA links to correct route; CTA absent on `cancelled` / `completed` / `no_show` cards
- [x] 7.4 Run full test suite: `npx vitest run` — all tests pass, no regressions
