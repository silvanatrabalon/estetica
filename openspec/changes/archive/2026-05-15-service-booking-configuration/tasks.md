## 1. Database Migration — Tables, Column Additions, Grants & RLS

- [x] 1.1 Create migration `supabase/migrations/YYYYMMDDHHMMSS_service_booking_config_tables_grants_rls.sql`
- [x] 1.2 Create `service_available_dates` table with composite PK `(service_id, available_date)`, FK ON DELETE CASCADE to `services`, FK to `organizations`, `created_at timestamptz DEFAULT now()`
- [x] 1.3 Add index on `(service_id)` for admin panel reads on `service_available_dates`
- [x] 1.4 Grant `SELECT` on `service_available_dates` to `authenticated`
- [x] 1.5 Enable RLS on `service_available_dates` and add SELECT policy allowing all authenticated users
- [x] 1.6 `ALTER TABLE public.services ADD COLUMN IF NOT EXISTS max_concurrent_bookings integer CHECK (max_concurrent_bookings IS NULL OR max_concurrent_bookings >= 1)`
- [x] 1.7 `ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS booking_min_notice_minutes integer DEFAULT 60 CHECK (...>= 0 AND ...<= 10080)` and `ADD COLUMN IF NOT EXISTS booking_max_horizon_days integer DEFAULT 60 CHECK (... >= 1 AND ...<= 365)`
- [x] 1.8 Apply migration to remote: `npx supabase db push`

## 2. Database Migration — Admin RPC Functions

- [x] 2.1 Create migration `supabase/migrations/YYYYMMDDHHMMSS_service_booking_config_admin_rpcs.sql`
- [x] 2.2 Implement `admin_list_service_available_dates(p_service_id uuid)` — returns all `available_date` rows for the service; sql language, `where public.is_admin()` guard
- [x] 2.3 Implement `admin_add_service_available_date(p_service_id uuid, p_date date)` — inserts row with `organization_id` resolved from `services.organization_id`; plpgsql, `is_admin()` guard
- [x] 2.4 Implement `admin_remove_service_available_date(p_service_id uuid, p_date date)` — deletes the matching row; plpgsql, `is_admin()` guard
- [x] 2.5 Extend `admin_update_service` to accept `p_max_concurrent_bookings integer` (nullable); update the function body to include the new column
- [x] 2.6 Implement `admin_update_booking_policy(p_min_notice_minutes integer, p_max_horizon_days integer)` — updates the organizations record; plpgsql, `is_admin()` guard
- [x] 2.7 Grant `EXECUTE` on all new functions to `authenticated`
- [x] 2.8 Apply migration to remote: `npx supabase db push`

## 3. Service Layer — adminServiceAvailability.ts

- [x] 3.1 Create `src/services/adminServiceAvailability.ts` with `ServiceAvailableDate` interface (`serviceId`, `availableDate`, `createdAt`)
- [x] 3.2 Implement `listServiceAvailableDates(serviceId: string): Promise<ServiceAvailableDate[]>` — calls `admin_list_service_available_dates`, maps snake→camelCase
- [x] 3.3 Implement `addServiceAvailableDate(serviceId: string, date: string): Promise<void>` — calls `admin_add_service_available_date`
- [x] 3.4 Implement `removeServiceAvailableDate(serviceId: string, date: string): Promise<void>` — calls `admin_remove_service_available_date`
- [x] 3.5 Add `export * from './adminServiceAvailability'` to `src/services/index.ts`

## 4. Service Layer — Update adminServices.ts and businessSettings.ts

- [x] 4.1 Add `maxConcurrentBookings: number | null` to the `Service` interface in `src/services/adminServices.ts`
- [x] 4.2 Add `max_concurrent_bookings` to the `ServiceRow` internal interface and include it in the `toService()` mapper
- [x] 4.3 Add `maxConcurrentBookings?: number | null` param to `createService` and `updateService` input types; pass `p_max_concurrent_bookings` to the respective RPCs
- [x] 4.4 Add `bookingMinNoticeMinutes: number` and `bookingMaxHorizonDays: number` to `BusinessSettingsRecord` in `src/services/businessSettings.ts`
- [x] 4.5 Add `booking_min_notice_minutes` and `booking_max_horizon_days` to `OrganizationRow` internal interface and include them in the mapper
- [x] 4.6 Add `updateBookingPolicy(minNoticeMinutes: number, maxHorizonDays: number): Promise<void>` to `src/services/businessSettings.ts` (or a new `adminBookingPolicy.ts` if preferred) — calls `admin_update_booking_policy`
- [x] 4.7 Export `updateBookingPolicy` via `src/services/index.ts`

## 5. New Page — AdminServiceAvailabilityPage

- [x] 5.1 Create `src/pages/AdminServiceAvailabilityPage.tsx`; read `serviceId` from `useParams<{ serviceId: string }>()`
- [x] 5.2 On mount: call `listServiceAvailableDates(serviceId)`; show loading state "Cargando fechas disponibles..." while fetching
- [x] 5.3 Render configured dates list ordered by date descending; each row shows the date and a "Eliminar" button
- [x] 5.4 Empty state when no dates configured: "Este servicio no tiene fechas específicas configuradas. Está disponible cualquier día."
- [x] 5.5 Add a date input (`<input type="date">`) and "Agregar fecha" button; on submit call `addServiceAvailableDate`, refresh list, show success "Fecha agregada correctamente."
- [x] 5.6 "Eliminar" button: call `removeServiceAvailableDate`, refresh list, show success "Fecha eliminada correctamente."
- [x] 5.7 Error state on load: "No pudimos cargar las fechas disponibles."; error on mutation: descriptive Spanish message
- [x] 5.8 Back button: `navigate('/admin/services')`
- [x] 5.9 Add `AdminServiceAvailabilityPage` export to `src/pages/index.ts`

## 6. Update AdminServicesPage

- [x] 6.1 Add "Gestionar disponibilidad" link per service row in `src/pages/AdminServicesPage.tsx` that navigates to `/admin/services/${service.id}/availability`
- [x] 6.2 Add `maxConcurrentBookings` field to the service create/edit inline form: an optional number input labeled "Capacidad simultánea (opcional)"; empty/blank = null
- [x] 6.3 Validate `maxConcurrentBookings` in the form: if provided, must be an integer ≥1; show Spanish error "La capacidad debe ser un número entero mayor a cero." on invalid
- [x] 6.4 Pass `maxConcurrentBookings` (null when blank) to `createService` and `updateService` calls
- [x] 6.5 Display `maxConcurrentBookings` in the service list row (e.g., "Cap: 3" or "Sin límite" when null)

## 7. Update BusinessSettingsPage

- [x] 7.1 Add a "Configuración de reservas" section to `src/pages/BusinessSettingsPage.tsx`
- [x] 7.2 Add an input for `booking_min_notice_minutes` labeled "Anticipación mínima (minutos)" with range hint (0–10080)
- [x] 7.3 Add an input for `booking_max_horizon_days` labeled "Horizonte de reservas (días)" with range hint (1–365)
- [x] 7.4 Load current values from `businessSettings.bookingMinNoticeMinutes` and `bookingMaxHorizonDays`
- [x] 7.5 Validate on save: notice 0–10080; horizon 1–365; show Spanish messages on violation
- [x] 7.6 On valid save call `updateBookingPolicy`; show success "Política de reservas actualizada." or error "No se pudo guardar la configuración."

## 8. Routing & Navigation

- [x] 8.1 Add route entry in `src/lib/routing.ts`: `{ path: '/admin/services/:serviceId/availability', access: 'role-restricted', allowedRoles: ['admin'] }`
- [x] 8.2 Import `AdminServiceAvailabilityPage` in `src/App.tsx`
- [x] 8.3 Add `<Route path="/admin/services/:serviceId/availability" element={<AdminServiceAvailabilityPage />} />` inside the admin route group in `src/App.tsx`

## 9. Tests — Service Layer Unit Tests (adminServiceAvailability)

- [x] 9.1 Create `src/services/adminServiceAvailability.test.ts`; mock `initSupabase` returning `{ rpc: vi.fn() }`
- [x] 9.2 Test `listServiceAvailableDates`: correct RPC name + `p_service_id` param; camelCase mapping of returned rows
- [x] 9.3 Test `addServiceAvailableDate`: correct RPC name + params; throws on error
- [x] 9.4 Test `removeServiceAvailableDate`: correct RPC name + params; throws on error

## 10. Tests — adminServices.ts Unit Tests

- [x] 10.1 Add test cases to `src/services/adminServices.test.ts` for `maxConcurrentBookings` mapping: null and numeric values round-trip through `toService()` mapper correctly
- [x] 10.2 Test `updateService` passes `p_max_concurrent_bookings` (including null) to the RPC

## 11. Tests — Integration Tests (AdminServiceAvailabilityPage)

- [x] 11.1 Create `src/pages/AdminServiceAvailabilityPage.test.tsx`; mock `../services/adminServiceAvailability`; render with `TestUserProvider` (admin) in `MemoryRouter` with `serviceId` param
- [x] 11.2 Test: loading state shown while fetch resolves
- [x] 11.3 Test: empty state shows correct Spanish message when `listServiceAvailableDates` returns `[]`
- [x] 11.4 Test: date list renders rows with date and "Eliminar" button when dates are returned
- [x] 11.5 Test: clicking "Agregar fecha" calls `addServiceAvailableDate` with correct params and shows success message
- [x] 11.6 Test: clicking "Eliminar" calls `removeServiceAvailableDate` with correct params and removes the row
- [x] 11.7 Test: RPC error on load shows Spanish error message
- [x] 11.8 Test: RPC error on add/remove shows Spanish error message

## 12. Tests — Integration Tests (AdminServicesPage capacity field)

- [x] 12.1 Add test to `src/pages/AdminServicesPage.test.tsx`: capacity field renders in service create/edit form
- [x] 12.2 Test: submitting capacity = 0 shows Spanish validation error
- [x] 12.3 Test: leaving capacity blank submits null (no error)
- [x] 12.4 Test: "Gestionar disponibilidad" link navigates to `/admin/services/:serviceId/availability`

## 13. Tests — Integration Tests (BusinessSettingsPage booking policy)

- [x] 13.1 Add test to `src/pages/BusinessSettingsPage.test.tsx`: "Configuración de reservas" section renders with current values
- [x] 13.2 Test: submitting notice = -1 shows Spanish validation error
- [x] 13.3 Test: submitting horizon = 0 shows Spanish validation error
- [x] 13.4 Test: valid save calls `updateBookingPolicy` and shows success message

## 14. Tests — RLS Smoke Tests

- [x] 14.1 Add to `supabase/tests/role_rls_matrix.sql`: authenticated non-admin can SELECT from `service_available_dates`
- [x] 14.2 Test: non-admin direct INSERT on `service_available_dates` is rejected by RLS
- [x] 14.3 Test: CHECK constraint on `services.max_concurrent_bookings` rejects 0 and negatives; accepts null and ≥1
- [x] 14.4 Test: PK on `(service_id, available_date)` rejects duplicate inserts
- [x] 14.5 Test: admin RPC `admin_add_service_available_date` succeeds for admin; raises "No autorizado" for non-admin
- [x] 14.6 Test: CHECK constraints on `organizations.booking_min_notice_minutes` and `booking_max_horizon_days` reject out-of-range values

## 15. Final Verification

- [x] 15.1 Run full test suite (`npm run test`) — all tests passing
- [x] 15.2 Manual smoke: navigate to `/admin/services`, click "Gestionar disponibilidad", add a date, verify it appears, remove it, verify it disappears
- [x] 15.3 Manual smoke: create/edit a service with a capacity value; verify it saves and displays
- [x] 15.4 Manual smoke: open Business Settings, update booking policy values, verify they save and reload correctly
- [x] 15.5 Verify routing guard: non-admin user redirected from `/admin/services/:serviceId/availability` to `/unauthorized`
