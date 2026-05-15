## 1. Database: get_appointment RPC

- [x] 1.1 Create migration `supabase/migrations/20260515400000_get_appointment_rpc.sql` with `get_appointment(p_appointment_id uuid)` SECURITY DEFINER function — joins `appointments`, `services`, `staff_members`, `organizations`; authorizes via `customer_user_id = auth.uid() OR is_staff_or_admin()`; uses explicit table aliases throughout to avoid 42702; returns empty on not-found/unauthorized; grants to `authenticated`
- [x] 1.2 Run `echo Y | npx supabase db push` and confirm migration applied

## 2. TypeScript Service Layer

- [x] 2.1 Add `AppointmentDetail` interface to `src/services/appointments.ts` (camelCase fields: `id`, `startsAt`, `endsAt`, `status`, `createdAt`, `customerUserId`, `serviceName`, `serviceDurationMinutes`, `servicePriceCents`, `staffDisplayName`, `orgName`, `orgTimezone`)
- [x] 2.2 Add `getAppointment(appointmentId: string): Promise<AppointmentDetail | null>` to `src/services/appointments.ts` — calls `supabase.rpc('get_appointment', { p_appointment_id })`, maps snake_case response to camelCase, returns `null` when rows is empty, throws on RPC error

## 3. Frontend: BookingConfirmationPage

- [x] 3.1 Replace stub `src/pages/BookingConfirmationPage.tsx` with full implementation:
  - Read `appointmentId` from `useParams()` (not navigation state)
  - Use `useUser` hook to wait for session readiness before triggering fetch
  - Four states: `loading` (initial), `success`, `not-found` (null result), `error` (thrown)
  - Loading: spinner + "Cargando tu turno..."
  - Not-found: "No encontramos tu turno. Verificá que el enlace sea correcto."
  - Error: "Ocurrió un error al cargar tu turno. Intentá de nuevo."
  - Success: service name, date in `org_timezone` (`Intl.DateTimeFormat`), time via `formatSlotTime`, duration in minutes, staff display name, business name, "Confirmado" status badge, booking reference = `appointmentId.slice(-8)`, "Ver mis turnos" → `/appointments`, "Hacer otra reserva" → `/booking`

## 4. SQL Smoke Tests

- [x] 4.1 Add smoke tests to `supabase/tests/appointment_booking.sql` covering:
  - Owner can retrieve their own appointment (correct joined fields returned)
  - Non-owner gets empty result for another customer's appointment
  - Staff/admin can retrieve any appointment
  - Unauthenticated caller is denied

## 5. TypeScript Tests

- [x] 5.1 Add `src/pages/BookingConfirmationPage.test.tsx`:
  - Loading state renders spinner with "Cargando tu turno..."
  - Success state renders service name, formatted date/time, staff name, status badge ("Confirmado"), booking reference (last 8 chars of UUID)
  - Not-found state renders "No encontramos tu turno..."
  - Error state renders "Ocurrió un error al cargar tu turno..."
  - "Ver mis turnos" button navigates to `/appointments`
  - "Hacer otra reserva" button navigates to `/booking`
  - Page fetches using appointmentId from route param on mount

## 6. Validation & Commit

- [x] 6.1 Run `npx vitest run` and confirm all tests pass
- [ ] 6.2 Commit all changes with conventional commit message
- [ ] 6.3 Update `BACKLOG.md` — mark #19 `[x] booking-confirmation-page (<hash>)`
