## Why

The admin currently lands on `/admin/users` after login — a management panel, not a command center. There is no single place to see today's workload at a glance, no at-a-glance KPIs for bookings or revenue, and no quick navigation to the most-used sections. `/admin/reports` exists as a stub but is disconnected from daily operations. This creates friction for every admin session and leaves operational data hidden.

## What Changes

- Add `admin_get_dashboard_stats()` SECURITY DEFINER RPC that returns aggregate KPIs (counts by status, revenue for the month) computed in `organizations.timezone`
- Add `src/services/adminDashboard.ts` service module with `AdminDashboardStats` interface and `getAdminDashboardStats()` function
- Add `AdminDashboardPage` at `/admin/dashboard` as the new admin home page
- Add `useAdminDashboardStats` hook with loading / error / data states
- Add `StatCard` component for KPI display with loading skeleton
- Add "Inicio" as the first nav item in the admin section linking to `/admin/dashboard`
- Remove `reports` from `navigationByRole.admin` (route stays registered, nav link removed)
- **BREAKING**: Change `roleHomeByRole.admin` from `/admin/users` to `/admin/dashboard` — admin landing after login changes

## Capabilities

### New Capabilities
- `admin-dashboard`: Admin home dashboard with KPI metric cards, today's appointments widget, quick-access navigation cards, and monthly booking analytics status-breakdown table

### Modified Capabilities
- `protected-routes-and-role-guards`: `roleHomeByRole.admin` changes from `/admin/users` to `/admin/dashboard`

## Impact

- `src/lib/routing.ts` — `roleHomeByRole.admin` updated
- `src/lib/navigation.ts` — admin nav: "Inicio" added as first item, "Reportes" removed
- `src/pages/AdminDashboardPage.tsx` — new page
- `src/services/adminDashboard.ts` — new service module
- `supabase/migrations/` — one new migration for `admin_get_dashboard_stats` RPC
- `src/lib/routing.test.ts` — routing policy test updated for new admin home
- `App.tsx` — new route registered
- Reuses `adminListAppointments` from `src/services/adminAppointments.ts` (no change to that module)
