## 1. Database Migration

- [x] 1.1 Create migration file `supabase/migrations/<timestamp>_admin_dashboard_stats.sql`
- [x] 1.2 Implement `admin_get_dashboard_stats()` SECURITY DEFINER function with admin-role check
- [x] 1.3 Add timezone-correct TODAY / this-week / this-month window logic using `COALESCE(org.timezone, 'UTC')`
- [x] 1.4 Add counts by status (`pending_count`, `confirmed_count`, `cancelled_count`, `completed_count`, `no_show_count`)
- [x] 1.5 Add `today_count`, `week_count`, `month_count` aggregate fields (all 0 not null)
- [x] 1.6 Add `revenue_cents_month` as SUM of `services.price_cents` for `completed` appointments this month
- [x] 1.7 Add SQL tests in `supabase/tests/` covering: correct counts per status, non-admin error, timezone boundary, 0-not-null, revenue only for completed

## 2. Service Layer

- [x] 2.1 Create `src/services/adminDashboard.ts`
- [x] 2.2 Define `AdminDashboardStats` interface (camelCase, all number fields)
- [x] 2.3 Implement `getAdminDashboardStats(): Promise<AdminDashboardStats>` calling the RPC
- [x] 2.4 Add `-- NOTE: price-at-query` comment documenting revenue approximation caveat
- [x] 2.5 Export `getAdminDashboardStats` and `AdminDashboardStats` from `src/services/index.ts`

## 3. Hook

- [x] 3.1 Create `useAdminDashboardStats` hook in `src/hooks/` (or `src/features/` if feature-scoped)
- [x] 3.2 Implement loading / error / data states with `useEffect` and `getAdminDashboardStats()`
- [x] 3.3 Write unit tests for hook: loading transition, success data, error state

## 4. StatCard Component

- [x] 4.1 Create `StatCard` component accepting `label`, `value`, `loading` props
- [x] 4.2 Implement loading skeleton (pulsing placeholder, no zero value shown while loading)
- [x] 4.3 Write unit test: renders label+value when loaded, renders skeleton when loading

## 5. Admin Dashboard Page

- [x] 5.1 Create `src/pages/AdminDashboardPage.tsx`
- [x] 5.2 Add five KPI `StatCard` instances: "Turnos hoy", "Turnos esta semana", "Turnos este mes", "Confirmados + pendientes hoy", "Ingresos estimados este mes" (ARS)
- [x] 5.3 Implement today's appointments widget (up to 10 rows, columns: hora / cliente / servicio / profesional / estado badge) using `adminListAppointments`
- [x] 5.4 Add "Ver todos los turnos" CTA → `/admin/appointments`
- [x] 5.5 Add "No hay turnos para hoy." empty state
- [x] 5.6 Add four quick-access link cards: Turnos, Calendario, Profesionales, Servicios
- [x] 5.7 Add monthly booking analytics status-breakdown table (Confirmado, Pendiente, Cancelado, Completado, No presentado with count + %)
- [x] 5.8 Add Spanish error state when stats fetch fails
- [x] 5.9 Export `AdminDashboardPage` from `src/pages/index.ts`

## 6. Routing and Navigation

- [x] 6.1 Add `/admin/dashboard` route in `App.tsx` under `RoleGuard allowedRoles={['admin']}`
- [x] 6.2 Update `roleHomeByRole.admin` in `src/lib/routing.ts` from `/admin/users` to `/admin/dashboard`
- [x] 6.3 Add `id: 'dashboard'`, label `"Inicio"` as first item in `navigationByRole.admin` in `src/lib/navigation.ts`
- [x] 6.4 Remove `reports` entry from `navigationByRole.admin`
- [x] 6.5 Update routing policy test in `src/lib/routing.test.ts` to assert `roleHomeByRole.admin === '/admin/dashboard'`

## 7. Integration Tests

- [x] 7.1 Test: admin landing after login navigates to `/admin/dashboard`
- [x] 7.2 Test: non-admin accessing `/admin/dashboard` is redirected to `/unauthorized`
- [x] 7.3 Test: dashboard page renders KPI cards, today's list, quick-access cards
- [x] 7.4 Test: "Ver todos los turnos" CTA navigates to `/admin/appointments`
- [x] 7.5 Test: loading state shows skeletons (not zeros); error state shows Spanish message
- [x] 7.6 Test: unit test for `getAdminDashboardStats()` camelCase field mapping
