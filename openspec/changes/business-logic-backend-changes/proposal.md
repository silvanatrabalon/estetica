## Why

The app has accumulated several backend gaps: the `no_show` appointment status is surfaced in UI but has no creation mechanism (it's a dead path), the public landing page can't communicate business closures to customers, admins have no way to bulk-purge appointment history, the dashboard analytics section lacks a date-range filter, and hard-deleting auth users requires a privileged Edge Function that doesn't yet exist. These items collectively block both product quality and admin utility goals.

## What Changes

- **BREAKING** — `admin_get_dashboard_stats()`: drop and recreate the RPC removing `no_show_count` from `RETURNS TABLE`; remove the "No presentado" stat card from `AdminDashboardPage`; this must be deployed atomically with the TypeScript interface update and filter chip removal
- Add a dedicated "Cancelados" stat card to the admin dashboard using the existing `cancelled_count` field
- Remove "No asistió" (`no_show`) as a filter option in the admin appointments view
- New `get_upcoming_closures()` SECURITY DEFINER RPC (granted to `anon`) reads from `business_closure_exceptions` and returns closures within the next 30 days; surface them as banners/list on the public landing page
- New `admin_delete_all_appointments()` SECURITY DEFINER RPC (admin-only); new "Zona de peligro" collapsible section in `/admin/settings/business` with double-confirmation UX
- New `admin_get_stats_by_range(p_date_from, p_date_to)` SECURITY DEFINER RPC (admin-only); powers a date-range selector in the admin dashboard analytics section
- New Supabase Edge Function `admin-delete-user`: performs pre-deletion FK cleanup, deactivates staff rows, then calls `supabase.auth.admin.deleteUser()`; exposed as "Eliminar usuario" action in `/admin/users`
- Migration to remove `NOT NULL` constraint from `appointments.created_by_user_id` (prerequisite for Edge Function)

## Capabilities

### New Capabilities
- `business-closure-visibility`: Surface upcoming and active business closures from `business_closure_exceptions` on the public landing page via a new `get_upcoming_closures()` anon-accessible RPC
- `admin-delete-all-appointments`: Danger zone action in business settings that bulk-deletes all appointment rows for the org, guarded by double-confirmation UX and a new `admin_delete_all_appointments()` RPC
- `admin-stats-by-range`: New `admin_get_stats_by_range(p_date_from, p_date_to)` RPC and dashboard date-range selector UI allowing admins to view aggregate appointment stats for arbitrary date windows
- `admin-delete-user`: Supabase Edge Function that safely hard-deletes an auth user after FK cleanup, plus the "Eliminar usuario" UI in the admin users panel

### Modified Capabilities
- `admin-dashboard`: Remove `no_show_count` from `admin_get_dashboard_stats()` RPC return shape and stat cards; add "Cancelados" stat card; replace static monthly analytics with date-range selector powered by `admin_get_stats_by_range`

## Impact

- **DB migrations**: (1) DROP + CREATE `admin_get_dashboard_stats` removing `no_show_count`; (2) CREATE `get_upcoming_closures` RPC; (3) CREATE `admin_delete_all_appointments` RPC; (4) CREATE `admin_get_stats_by_range` RPC; (5) ALTER `appointments.created_by_user_id` DROP NOT NULL
- **TypeScript**: `AdminDashboardStats` interface update; new `getUpcomingClosures()` service; new `adminDeleteAllAppointments()` service; new `getStatsByRange()` service
- **Frontend**: `AdminDashboardPage` (stat card removal + date-range analytics); `AdminSettingsPage` (danger zone section); `LandingPage` (closure banners); `AdminUsersPage` (delete user action)
- **Supabase Edge Function**: new `supabase/functions/admin-delete-user/` requiring `SUPABASE_SERVICE_ROLE_KEY`
- **Breaking deploy constraint**: 44a migration + TS interface + frontend must deploy atomically to avoid runtime errors
