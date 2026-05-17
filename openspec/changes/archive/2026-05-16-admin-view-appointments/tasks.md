## 1. DB Migration — admin_list_appointments RPC

- [x] 1.1 Create migration file `supabase/migrations/YYYYMMDDHHMMSS_admin_list_appointments_rpc.sql`
- [x] 1.2 Implement `admin_list_appointments(p_statuses text[], p_date_from timestamptz, p_date_to timestamptz, p_page integer, p_page_size integer)` SECURITY DEFINER function with `is_admin()` authorization guard
- [x] 1.3 Add NULL-safe filtering: `p_statuses IS NULL OR status = ANY(p_statuses)`, `p_date_from IS NULL OR starts_at >= p_date_from`, `p_date_to IS NULL OR starts_at <= p_date_to`
- [x] 1.4 Add `COUNT(*) OVER() AS total_count` window function for single-query pagination metadata
- [x] 1.5 JOIN `services` for `service_name`, `staff_members` for `staff_display_name`, `profiles` + `auth.users` for `customer_name` with `COALESCE(pr.full_name, au.email, '—')`
- [x] 1.6 Apply `ORDER BY starts_at DESC`, `LIMIT COALESCE(p_page_size, 50) OFFSET (COALESCE(p_page, 1) - 1) * COALESCE(p_page_size, 50)`
- [x] 1.7 Add `GRANT EXECUTE ON FUNCTION public.admin_list_appointments(...) TO authenticated`
- [x] 1.8 Run `npx supabase db push` and verify migration applies cleanly

## 2. SQL Smoke Tests

- [x] 2.1 Add smoke tests to `supabase/tests/role_rls_matrix.sql`: admin with no filters returns all org appointments
- [x] 2.2 Add test: non-admin caller raises permission error
- [x] 2.3 Add test: `p_statuses = ARRAY['cancelled']` returns only cancelled rows
- [x] 2.4 Add test: date range filter (`p_date_from`, `p_date_to`) returns only in-range rows
- [x] 2.5 Add test: `p_page = 2, p_page_size = 10` returns rows 11–20
- [x] 2.6 Add test: `total_count` equals the full filtered row count regardless of page size
- [x] 2.7 Add test: `customer_name` populated from `profiles.full_name` when set
- [x] 2.8 Add test: `customer_name` falls back to email when `full_name` is NULL
- [x] 2.9 Add test: `customer_name` is `'—'` when both `full_name` and email are NULL

## 3. Service Layer — adminAppointments.ts

- [x] 3.1 Create `src/services/adminAppointments.ts`
- [x] 3.2 Define `AdminAppointmentRow` interface: `{ id, startsAt, endsAt, status, serviceName, staffDisplayName, customerName, createdAt, totalCount }`
- [x] 3.3 Define `AdminAppointmentFilters` interface: `{ statuses?: string[]; dateFrom?: string; dateTo?: string }`
- [x] 3.4 Define `AdminAppointmentPage` interface: `{ rows: AdminAppointmentRow[]; totalCount: number }`
- [x] 3.5 Implement `adminListAppointments(filters: AdminAppointmentFilters, page: number, pageSize?: number): Promise<AdminAppointmentPage>` — calls RPC, maps snake_case → camelCase, derives `totalCount` from `rows[0]?.total_count ?? 0`
- [x] 3.6 Export all types and functions from `src/services/index.ts` (or verify `export *` already covers it)

## 4. AdminAppointmentsPage — Core

- [x] 4.1 Create `src/pages/AdminAppointmentsPage.tsx`
- [x] 4.2 Register route `/admin/appointments` in `src/lib/routing.ts` with `role-restricted` for `admin`
- [x] 4.3 Add route + `RoleGuard allowedRoles={['admin']}` in `App.tsx` for `AdminAppointmentsPage`
- [x] 4.4 Add "Turnos" navigation link to `/admin/appointments` in the admin sidebar/nav component
- [x] 4.5 Implement local state: `filters` (statuses + date range), `page`, `loading`, `error`, `result` (`AdminAppointmentPage`)
- [x] 4.6 Fetch on mount and on any filter/page change via `useEffect`
- [x] 4.7 Render loading state: "Cargando turnos..."
- [x] 4.8 Render error state in Spanish: "Ocurrió un error al cargar los turnos."
- [x] 4.9 Render empty state in Spanish: "No hay turnos que coincidan con los filtros."

## 5. AdminAppointmentsPage — Table and Filters

- [x] 5.1 Render table/list with columns: **cliente**, **servicio**, **profesional**, **fecha/hora**, **estado**
- [x] 5.2 Format `startsAt` using `formatSlotTime` (from `src/lib/`) in org timezone
- [x] 5.3 Render status badges reusing the same color mapping as `AppointmentCard` (import or extract shared util)
- [x] 5.4 Render status filter: multi-select chips for `pending`, `confirmed`, `cancelled`, `completed`, `no_show` with Spanish labels
- [x] 5.5 Toggling a status chip updates `filters.statuses` and resets `page` to 1
- [x] 5.6 Render date range inputs: `<input type="date">` for "Desde" and "Hasta"
- [x] 5.7 Changing a date input updates `filters.dateFrom`/`filters.dateTo` and resets `page` to 1

## 6. AdminAppointmentsPage — Pagination

- [x] 6.1 Render previous/next pagination controls and current page indicator
- [x] 6.2 Disable previous button when `page === 1`
- [x] 6.3 Disable next button when `page * pageSize >= totalCount`
- [x] 6.4 Next button increments `page` by 1 and re-fetches
- [x] 6.5 Previous button decrements `page` by 1 and re-fetches

## 7. Tests

- [x] 7.1 Create `src/services/adminAppointments.test.ts` — test `adminListAppointments` maps RPC response to `AdminAppointmentPage` with correct camelCase fields
- [x] 7.2 Test: `totalCount` derived from `rows[0].total_count` (non-empty) and 0 (empty)
- [x] 7.3 Test: filter params correctly passed to RPC (statuses, dateFrom, dateTo, page, pageSize)
- [x] 7.4 Create `src/pages/AdminAppointmentsPage.test.tsx` — test: list renders rows with correct columns
- [x] 7.5 Test: loading state shows Spanish text
- [x] 7.6 Test: empty state shows Spanish text
- [x] 7.7 Test: error state shows Spanish text
- [x] 7.8 Test: status chip click calls service with updated statuses and resets to page 1
- [x] 7.9 Test: date input change calls service with updated date range and resets to page 1
- [x] 7.10 Test: next page button calls service with incremented page
- [x] 7.11 Test: previous page button disabled on page 1
- [x] 7.12 Test: next page button disabled when on last page
- [x] 7.13 Run `npx vitest run` — all existing tests still pass; new tests pass
