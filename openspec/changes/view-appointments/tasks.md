## 1. Database — list_appointments RPC

- [x] 1.1 Create migration `supabase/migrations/<timestamp>_list_appointments_rpc.sql` with `list_appointments()` SECURITY DEFINER function
- [x] 1.2 Function returns joined columns: `id`, `starts_at`, `ends_at`, `status`, `service_name`, `service_duration_minutes`, `service_price_cents`, `staff_display_name`, `org_name`, `org_timezone`, `customer_name`, `customer_user_id`
- [x] 1.3 Role-aware filter logic: customer → `customer_user_id = auth.uid()`; staff → `staff_members.profile_user_id = auth.uid()`; admin → all org appointments
- [x] 1.4 Hard limit: `ORDER BY starts_at DESC LIMIT 200`; GRANT to `authenticated`
- [x] 1.5 Apply migration: `echo Y | npx supabase db push 2>&1`

## 2. SQL Smoke Tests

- [x] 2.1 Add section to `supabase/tests/appointment_booking.sql` (or new file): customer sees only own appointments
- [x] 2.2 Staff sees only assigned appointments; non-owner customer gets no data
- [x] 2.3 Admin sees all org appointments
- [x] 2.4 Verify joined fields (`service_name`, `staff_display_name`, `customer_name`) are correct
- [x] 2.5 Unauthenticated caller raises permission error

## 3. Service Layer

- [x] 3.1 Add `AppointmentSummary` interface to `src/services/appointments.ts` (camelCase: `id`, `startsAt`, `endsAt`, `status`, `serviceName`, `serviceDurationMinutes`, `servicePriceCents`, `staffDisplayName`, `orgName`, `orgTimezone`, `customerName`, `customerUserId`)
- [x] 3.2 Add `AppointmentSummaryRow` snake_case interface for raw RPC response
- [x] 3.3 Add `listAppointments(): Promise<AppointmentSummary[]>` function calling the RPC with camelCase mapper
- [x] 3.4 Export `AppointmentSummary` and `listAppointments` from `src/services/index.ts`

## 4. useAppointments Hook

- [x] 4.1 Create `src/hooks/useAppointments.ts` with `loading`, `appointments`, and `error` state
- [x] 4.2 Call `listAppointments()` on mount; handle loading/success/error transitions
- [x] 4.3 Export from `src/hooks/index.ts`
- [x] 4.4 Write `src/hooks/useAppointments.test.tsx`: loading state, success with data, empty array result, error state (mock `listAppointments` at service level)

## 5. Shared AppointmentCard Component

- [x] 5.1 Create `src/components/appointments/AppointmentCard.tsx` accepting `appointment: AppointmentSummary`, `showCustomerName: boolean`, `orgTimezone: string` props
- [x] 5.2 Card displays: service name, date/time via `formatSlotTime`, staff display name OR customer name (based on prop), status badge with color per status, booking reference (`appointment.id.slice(-8).toUpperCase()`)
- [x] 5.3 Card is a `<Link>` to `/booking/confirmation/:id`
- [x] 5.4 Export from `src/components/index.ts`

## 6. Calendar Components

- [x] 6.1 Create `src/components/appointments/WeeklyCalendar.tsx`: 7-column CSS Grid layout, appointments rendered as positioned time blocks in the correct day column using `starts_at` UTC → org timezone conversion
- [x] 6.2 Create `src/components/appointments/MonthlyCalendar.tsx`: 6×7 month grid, appointments as event chips per day cell (max 3 per cell with "+N más" overflow indicator)
- [x] 6.3 Both components accept `appointments: AppointmentSummary[]`, `orgTimezone: string`, `currentDate: Date` props and navigation arrows (prev/next)
- [x] 6.4 Export both from `src/components/index.ts`

## 7. AppointmentsPage (Customer)

- [x] 7.1 Replace stub `src/pages/AppointmentsPage.tsx` with full implementation
- [x] 7.2 Use `useAppointments()` hook; show loading state ("Cargando tus turnos...") while fetching
- [x] 7.3 Render Próximos / Historial tabs; filter appointments client-side by tab criteria
- [x] 7.4 Show empty state per tab in Spanish ("No tenés turnos próximos", "No hay turnos en tu historial")
- [x] 7.5 Show error state in Spanish ("Ocurrió un error al cargar tus turnos.")
- [x] 7.6 Render Lista ↔ Calendario toggle; in calendar mode show week/month sub-toggle
- [x] 7.7 In Lista mode: render `AppointmentCard` for each appointment in active tab
- [x] 7.8 In Calendario mode: render `WeeklyCalendar` or `MonthlyCalendar` with all appointments (not tab-filtered) and navigation controls

## 8. StaffAppointmentsPage (Staff)

- [x] 8.1 Replace stub `src/pages/StaffAppointmentsPage.tsx` with full implementation (same structure as AppointmentsPage)
- [x] 8.2 Pass `showCustomerName={true}` to `AppointmentCard`; empty states use staff-appropriate copy ("No tenés turnos asignados", etc.)
- [x] 8.3 Loading and error states in Spanish

## 9. Routing

- [x] 9.1 Verify `/appointments` is registered in `src/lib/routing.ts` with `allowedRoles: ['customer']` (update if currently a stub)
- [x] 9.2 Add `/staff/appointments` route to `src/lib/routing.ts` with `allowedRoles: ['staff']`
- [x] 9.3 Verify both routes are wired in `src/App.tsx` with `RoleGuard`
- [x] 9.4 Add `/staff/appointments` link to staff navigation in `src/lib/navigation.ts`

## 10. Page Tests

- [x] 10.1 Create `src/pages/AppointmentsPage.test.tsx`: loading state, Próximos tab content, Historial tab content, tab switching, empty state per tab in Spanish, error state in Spanish
- [x] 10.2 Test Lista ↔ Calendario toggle renders correct component
- [x] 10.3 Test appointment card shows correct fields (service name, formatted time, staff name, booking ref)
- [x] 10.4 Test card links to `/booking/confirmation/:id`
- [x] 10.5 Create `src/pages/StaffAppointmentsPage.test.tsx`: same coverage but verifying customer name is shown in cards, staff-appropriate empty state copy
- [x] 10.6 Run full test suite: `npx vitest run 2>&1 | grep -E "Test Files|Tests|passed|failed"` — verify all pass
