## 1. Backend Preparation (Required for 43h)

- [x] 1.1 Locate exact current signature of `get_appointment()` in latest migration file
- [x] 1.2 Write migration: `DROP FUNCTION get_appointment(...)` + `CREATE OR REPLACE FUNCTION get_appointment(...)` adding `customer_name text` column via JOIN to `profiles.full_name`
- [x] 1.3 Audit existing callers (`BookingConfirmationPage`, `ReschedulePage`) to confirm they handle the new `customer_name` field without breaking
- [x] 1.4 Apply and verify migration against local Supabase instance

## 2. Cleanup — Remove Empty / Noisy Elements (43c, 43e)

- [x] 2.1 Remove "Clientes" nav entry from staff navigation in `src/lib/navigation.ts`
- [x] 2.2 Remove or redirect `/staff/clients` route in `App.tsx`; optionally keep `StaffClientsPage.tsx` as a redirect to `/staff/appointments`
- [x] 2.3 Remove the "Accesos rápidos" quick-access card grid section from `AdminDashboardPage.tsx`
- [x] 2.4 Remove the "Turnos de hoy" compact list widget from `AdminDashboardPage.tsx`

## 3. Booking Wizard Fixed Navigation (43a)

- [x] 3.1 Add fixed back button (`← Volver`) to `BookingPage.tsx` — `position: fixed`, top-left, hidden on Step 1
- [x] 3.2 Add fixed primary CTA to `BookingPage.tsx` — `position: fixed`, bottom-right on desktop (`md:` breakpoint), full-width bottom on mobile
- [x] 3.3 Add top/bottom padding to the scrollable step content wrapper so content is not hidden behind the fixed elements
- [x] 3.4 Confirm CTA label is "Siguiente" on Steps 1–3 and "Confirmar reserva" on Step 4

## 4. Calendar & Appointments (43b, 43d)

- [x] 4.1 In `AppointmentsPage.tsx` and `StaffAppointmentsPage.tsx`, conditionally rename the "Semanal" toggle label to "Diario" on mobile viewports (`< md`)
- [x] 4.2 Replace chip-style status filters in `AdminAppointmentsPage.tsx` with a `<select>` dropdown (options: Todos, Confirmado, Pendiente, Cancelado, Completado)
- [x] 4.3 Remove "No asistió" / `no_show` from the status filter options in `AdminAppointmentsPage.tsx`
- [x] 4.4 Update filter state type and the `adminListAppointments` call to accept a single status from the dropdown

## 5. Admin Dashboard — Date-Range Analytics (43f) ⚠️ BLOCKED ON #44d

- [x] 5.1 Add `adminDashboard.ts` service method `getAdminStatsByRange(dateFrom, dateTo): Promise<AdminRangeStats>` — stub that throws until #44d RPC is deployed
- [x] 5.2 Add `AdminRangeStats` TypeScript interface with fields: `pendingCount`, `confirmedCount`, `cancelledCount`, `completedCount`, `totalCount`, `revenueCents`
- [x] 5.3 Replace the fixed "Resumen del mes actual" heading and static breakdown table in `AdminDashboardPage.tsx` with a date-range preset selector (Hoy / Último mes / Últimos 6 meses / Último año)
- [x] 5.4 Wire the preset selector to compute `dateFrom`/`dateTo` and call `getAdminStatsByRange`
- [x] 5.5 Render the status-breakdown table (Confirmado, Pendiente, Cancelado, Completado — no no_show row) from the range stats result
- [x] 5.6 Ensure fixed-window KPI cards ("Turnos hoy", "Turnos esta semana") are not affected by the range selector

## 6. Admin Business Settings — Form Ergonomics (43g, 43i)

- [x] 6.1 Replace the `primary_color` hex text input in `BusinessSettingsPage.tsx` with `<input type="color">`
- [x] 6.2 Add helper text below the color picker: "Define el color de acento del sistema de turnos (botones, badges, resaltados — actualmente verde)."
- [x] 6.3 Replace the `booking_min_notice_minutes` plain number input with a segmented Días/Horas/Minutos input in `BusinessSettingsPage.tsx`
- [x] 6.4 Implement decompose-on-load logic: stored minutes → days/hours/minutes breakdown
- [x] 6.5 Implement combine-on-save logic: days*1440 + hours*60 + minutes → total minutes
- [x] 6.6 Add helper text below the segmented input: "Tiempo mínimo de anticipación para que un cliente pueda reservar un turno. Ej: 2 horas significa que no se pueden reservar turnos con menos de 2 horas de anticipación."
- [x] 6.7 Add helper text below `booking_max_horizon_days`: "Cuántos días hacia adelante puede reservar un cliente. Ej: 30 días significa que solo se pueden ver disponibilidades dentro del próximo mes."

## 7. Admin Users — Deactivate Tooltip (43j)

- [x] 7.1 Add tooltip or helper text next to the "Desactivar" action in `AdminUsersPage.tsx` with copy: "El usuario no podrá iniciar sesión ni realizar reservas. Sus datos y reservas existentes se conservan."

## 8. Admin Staff — Mobile Redesign (43k)

- [x] 8.1 In `AdminStaffPage.tsx`, add mobile list view (hidden at `md:`) rendering staff names as tappable rows
- [x] 8.2 Implement `selectedStaffId` local state; clicking a name toggles an inline expanded panel with account email, role, and action buttons
- [x] 8.3 Hide the staff table on mobile (`hidden md:table` or equivalent), show on desktop
- [x] 8.4 Rename "Nombre" column header to "Nombre visible" and "Usuario vinculado" to "Cuenta" in the desktop table
- [x] 8.5 Add FAB "Agregar profesional" button (fixed bottom-right, `md:hidden`) for mobile; hide the top-right inline button on mobile

## 9. Admin Services — Layout, Mobile, Form Changes (43l, 43m, 43n, 43o)

- [x] 9.1 Split `AdminServicesPage.tsx` into two visually distinct sections: Servicios (with its own "Agregar servicio" button) and Categorías (with its own "Agregar categoría" button)
- [x] 9.2 Add mobile card list view for the services section (`< md`): card shows service name, category tag, ARS price, active/inactive badge, action icons
- [x] 9.3 Hide the services table on mobile; show on desktop
- [x] 9.4 In the service create/edit form, replace the `duration_minutes` number input with two fields: Horas + Minutos
- [x] 9.5 Implement decompose-on-load and combine-on-save logic for the two-field duration input
- [x] 9.6 Add tooltip/help indicator on "Capacidad simultánea" with copy: "Máximo de turnos que se pueden agendar al mismo tiempo para este servicio. Útil si tenés varias plazas o equipos disponibles. Dejá en blanco para ilimitado."
- [x] 9.7 Add confirmation dialog before deactivating a service; dialog text: "Este servicio no aparecerá en el sistema de turnos y los clientes no podrán reservarlo. Los turnos existentes no se cancelan automáticamente."
- [x] 9.8 Only call the deactivate RPC after the admin confirms the dialog
- [x] 9.9 In `AdminServiceAvailabilityPage.tsx`, render a `<select>` dropdown for day-of-week selection on mobile instead of checkboxes
- [x] 9.10 Replace the full-width "Volver a servicios" button with a top-left back arrow link "← Servicios"

## 10. Admin Calendar — Appointment Detail on Click (43h)

- [x] 10.1 Add `AppointmentDetailPanel` component (sheet/modal): renders customer name, service name, staff name, date & time, duration, status badge
- [x] 10.2 Wire click handler on all appointment blocks in `AdminCalendarPage.tsx` to open the detail panel (regardless of status)
- [x] 10.3 For `cancelled` / `completed` appointments: render detail in read-only mode (no action buttons)
- [x] 10.4 For `pending` / `confirmed` appointments: add "Reprogramar" (opens slot picker) and "Cancelar" (with confirmation) action buttons
- [x] 10.5 Remove the "No autorizado" error toast that currently fires when clicking a cancelled appointment block
- [x] 10.6 Add subtle drag hint in the calendar header: "Arrastrá un turno para reprogramarlo" — visible only when reschedulable appointments exist in the current view
- [x] 10.7 Update the `getAppointment` TypeScript service layer to include `customerName` in the return type mapping

## 11. Admin Landing Settings — Color Pickers + Mobile + Font Scope (43p)

- [x] 11.1 Replace `primary_color` hex text input in `LandingConfigPage.tsx` with `<input type="color">` and add helper text: "Color del overlay del hero y botones"
- [x] 11.2 Replace `secondary_color` hex text input in `LandingConfigPage.tsx` with `<input type="color">` and add helper text: "Color de fondo de tarjetas y acentos"
- [x] 11.3 Fix mobile layout overflow: wrap color and font inputs in a responsive flex/grid container that does not overflow narrow viewports
- [x] 11.4 Update the `font_family` CSS injection in `LandingPage.tsx` to set `font-family` on the root HTML element (or `<body>`) so all landing page text inherits the selected font — not just the hero section
