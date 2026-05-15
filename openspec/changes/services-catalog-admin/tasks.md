## 1. Database Migrations

- [x] 1.1 Create migration `20260515000000_services_tables_grants_rls.sql`: add `image_url text` nullable column to `services`, revoke direct INSERT/UPDATE/DELETE from `authenticated`, grant SELECT on `services` to `authenticated`, create RLS policies (admin writes via RPCs; SELECT for all authenticated)
- [x] 1.2 Create migration `20260515000001_services_admin_rpc.sql`: create SECURITY DEFINER functions `admin_list_services()`, `admin_create_service(p_name text, p_duration_minutes int, p_price_cents int, p_image_url text)`, `admin_update_service(p_service_id uuid, p_name text, p_duration_minutes int, p_price_cents int, p_image_url text)`, `admin_set_service_active(p_service_id uuid, p_is_active boolean)` — all with `is_admin()` guard
- [x] 1.3 Apply migrations to local Supabase and verify via `supabase db status`

## 2. TypeScript Service Layer

- [x] 2.1 Create `src/services/adminServices.ts`: define `Service` type, implement `listServices()`, `createService()`, `updateService()`, `setServiceActive()` wrapping the four RPCs with error handling
- [x] 2.2 Export from `src/services/index.ts`

## 3. Admin Services Page

- [x] 3.1 Replace `AdminServicesPage.tsx` placeholder with full CRUD panel following the `AdminStaffPage` pattern: state for `services`, `formData`, `editingId`, `error`, `loading`; inline create/edit form (show/hide toggle)
- [x] 3.2 Implement service list table with columns: nombre, duración, precio (ARS format), imagen (thumbnail / placeholder), estado (activo/inactivo badge), acciones (editar, activar/desactivar)
- [x] 3.3 Implement create form with fields: nombre (required, min 2 chars), duración en minutos (required, 1–480), precio en centavos (required, ≥ 0), URL de imagen (optional); all validation messages in Spanish
- [x] 3.4 Implement deactivate/reactivate toggle calling `setServiceActive()` without leaving the list
- [x] 3.5 Add image preview with `onError` fallback to placeholder icon when `image_url` is present
- [x] 3.6 Format price display: `(price_cents / 100).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })`; zero shows as `$0,00`

## 4. Tests

- [x] 4.1 Write unit tests for price formatting utility (ARS locale, zero, large values)
- [x] 4.2 Write SQL smoke test in `supabase/tests/`: verify non-admin cannot INSERT/UPDATE/DELETE `services` directly; verify admin RPC functions succeed when called by admin role
- [x] 4.3 Write integration test for `AdminServicesPage`: create service, edit service, deactivate service — using MSW or Supabase mock

## 5. Validation & Cleanup

- [x] 5.1 Run `pnpm test` (all 132+ tests pass)
- [x] 5.2 Verify `/admin/services` route works end-to-end: list loads, create succeeds, edit updates, deactivate toggles status
- [x] 5.3 Verify non-admin (`customer` or `staff` active role) is redirected to `/unauthorized` on `/admin/services`
