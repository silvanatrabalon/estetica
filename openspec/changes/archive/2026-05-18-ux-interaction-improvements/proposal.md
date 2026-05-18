## Why

The existing UI has several interaction patterns that hinder usability: booking wizard navigation is not persistently visible while scrolling, admin panels lack mobile-friendly layouts, form inputs use raw text fields where ergonomic controls exist, and several UI elements (staff clients tab, no-show filter, quick-access cards) add noise without value. Addressing these in a batch improves the overall UX quality and reduces friction for all user roles.

## What Changes

- **Booking wizard**: Back button fixed to top-left; primary CTA fixed to bottom-right (desktop) / bottom full-width (mobile) across all 4 steps
- **Mobile calendar label**: Rename "Semanal" tab to "Diario" (or hide it) on mobile in `/appointments` and `/staff/appointments`
- **Staff clients tab**: Remove the empty "Clientes" tab/nav entry from staff navigation
- **Admin appointments filter**: Replace chip-style status filters with a `<select>` dropdown; remove "No asistió" option
- **Admin dashboard**: Remove "Accesos rápidos" card grid and "Turnos de hoy" widget; KPI cards and analytics remain
- **Admin dashboard analytics**: Add date-range preset selector (Hoy / Último mes / Últimos 6 meses / Último año) to drive the analytics section — **blocked on #44d RPC**
- **Admin business settings – color picker**: Replace hex text input for "Color principal" with `<input type="color">`; add helper copy
- **Admin calendar – appointment detail**: Clicking any appointment block opens a detail sheet; read-only for cancelled/completed; action buttons for pending/confirmed — requires `get_appointment()` RPC migration to include `customer_name`
- **Admin business settings – booking config ergonomics**: Replace plain `booking_min_notice_minutes` input with segmented days/hours/minutes fields; add helper copy for `booking_max_horizon_days`
- **Admin users – deactivate tooltip**: Add helper text explaining what deactivation means
- **Admin staff page – mobile redesign**: Name-only list on mobile with expandable inline panel; FAB for "Agregar profesional"; rename columns
- **Admin services page – layout + mobile**: Split into Servicios / Categorías sections; card list on mobile
- **Admin service form – duration input**: Replace plain minutes input with Horas + Minutos fields; add tooltip for "Capacidad simultánea"
- **Admin service deactivate – confirmation dialog**: Show warning dialog before deactivating a service
- **Admin service availability – mobile UX**: Replace day-of-week checkboxes with `<select>` on mobile; replace "Volver" button with top-left back arrow
- **Admin landing settings – color pickers + mobile**: Replace hex inputs with color pickers; fix mobile layout overflow; apply `font_family` to all landing page text via root element CSS injection

## Capabilities

### New Capabilities

- `ux-interaction-improvements`: Cross-cutting frontend UX changes across booking wizard, calendar views, admin panels, and staff pages — fixed navigation, mobile redesigns, ergonomic form inputs, and interaction polish

### Modified Capabilities

- `appointment-booking`: Fixed back/CTA navigation added to all 4 booking wizard steps
- `calendar-system-ui`: Mobile weekly calendar label renamed to "Diario"; no behaviour change beyond label
- `admin-view-appointments`: Status filter replaced with dropdown; no_show option removed
- `admin-dashboard`: Quick-access and today's widgets removed; date-range analytics selector added (blocked on #44d)
- `business-settings-profile`: Color picker replaces hex input; segmented duration input for booking config fields
- `admin-calendar-time-axis`: Appointment detail sheet on block click; `get_appointment` RPC updated to return `customer_name`
- `admin-user-management-panel`: Deactivate helper text added
- `staff-professionals-management`: Mobile table replaced with expandable list; column labels updated; FAB button
- `services-catalog-admin`: Page split into two sections; mobile card list; duration two-field input; deactivate confirmation; service availability mobile UX
- `landing-config-admin`: Color pickers replace hex inputs; mobile layout fixes; font_family applied globally

## Impact

- **Frontend files**: `BookingPage.tsx`, `AppointmentsPage.tsx`, `StaffAppointmentsPage.tsx`, `StaffClientsPage.tsx` (remove or redirect), `AdminAppointmentsPage.tsx`, `AdminDashboardPage.tsx`, `BusinessSettingsPage.tsx`, `AdminCalendarPage.tsx`, `AdminUsersPage.tsx`, `AdminStaffPage.tsx`, `AdminServicesPage.tsx`, `AdminServiceAvailabilityPage.tsx`, `LandingConfigPage.tsx`
- **Navigation**: `src/lib/navigation.ts` — remove "Clientes" staff nav entry; rename columns in admin staff table
- **Backend (migration required)**: `get_appointment()` RPC must be updated (DROP + CREATE) to return `customer_name` via JOIN — breaking change; existing callers (`BookingConfirmationPage`, `ReschedulePage`) must be audited
- **Dependencies**: 43f (date-range analytics) blocked on #44d (`admin_get_stats_by_range` RPC); 43h (appointment detail) requires `get_appointment` RPC migration
- **No new npm dependencies** introduced
