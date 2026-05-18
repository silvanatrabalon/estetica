## 1. 44a — Remove no_show from Dashboard Stats (BREAKING — deploy atomically)

- [ ] 1.1 Write migration: `DROP FUNCTION admin_get_dashboard_stats()` + `CREATE` without `no_show_count` column in `RETURNS TABLE`
- [ ] 1.2 Update `AdminDashboardStats` TypeScript interface in `src/services/adminDashboard.ts` — remove `noShowCount` field
- [ ] 1.3 Remove "No presentado" stat card from `AdminDashboardPage.tsx`
- [ ] 1.4 Add "Cancelados" stat card to `AdminDashboardPage.tsx` using existing `cancelledCount` field
- [ ] 1.5 Remove "No asistió" (`no_show`) option from the admin appointments status filter in `AdminAppointmentsPage` (or wherever the filter chip/dropdown is rendered)
- [ ] 1.6 Verify all callers of `getAdminDashboardStats()` compile without reference to `noShowCount`

## 2. 44d — admin_get_stats_by_range RPC

- [ ] 2.1 Write migration: `CREATE FUNCTION admin_get_stats_by_range(p_date_from timestamptz, p_date_to timestamptz)` SECURITY DEFINER, admin-only, returns `pending_count`, `confirmed_count`, `cancelled_count`, `completed_count`, `total_count`, `revenue_cents` — all `0` when no rows; date window on `starts_at`
- [ ] 2.2 Grant `EXECUTE` on `admin_get_stats_by_range` to `authenticated`
- [ ] 2.3 Add `StatsByRange` TypeScript interface to `src/services/adminDashboard.ts`
- [ ] 2.4 Implement `getStatsByRange(dateFrom: string, dateTo: string): Promise<StatsByRange>` in `src/services/adminDashboard.ts`
- [ ] 2.5 Add `useStatsByRange` hook (or inline state) in `AdminDashboardPage` with loading / error / data
- [ ] 2.6 Add date-range preset selector UI ("Hoy", "Último mes", "Últimos 6 meses", "Último año") to the analytics section of `AdminDashboardPage`
- [ ] 2.7 Compute `dateFrom` / `dateTo` from each preset and call `getStatsByRange` on preset change
- [ ] 2.8 Render status-breakdown table (Confirmado, Pendiente, Cancelado, Completado) with count + percentage; ensure "No presentado" row is absent
- [ ] 2.9 Add Spanish loading skeleton and error message to the analytics section
- [ ] 2.10 Ensure fixed KPI cards ("Turnos hoy", "Turnos esta semana") are not affected by preset changes

## 3. 44b — Business Closures on Landing Page

- [ ] 3.1 Write migration: `CREATE FUNCTION get_upcoming_closures()` SECURITY DEFINER returning `closure_date`, `closure_type`, `starts_at`, `ends_at`, `reason` — filtered to `closure_date >= CURRENT_DATE AND closure_date <= CURRENT_DATE + 30`, ordered by `closure_date ASC`
- [ ] 3.2 Grant `EXECUTE` on `get_upcoming_closures` to `anon` and `authenticated`
- [ ] 3.3 Add `UpcomingClosure` TypeScript interface and `getUpcomingClosures(): Promise<UpcomingClosure[]>` to `src/services/landing.ts` (or new `src/services/closures.ts`)
- [ ] 3.4 Fetch `getUpcomingClosures()` on `LandingPage` mount (separate from `getLandingConfig()`)
- [ ] 3.5 Render today's closure banner above the hero: "Hoy estamos cerrados." (full-day) or "Hoy cerrado de HH:MM a HH:MM." (half-day) — no dismiss button
- [ ] 3.6 Render upcoming closures list above the footer (only when `closureDate > today`): "El [fecha] estaremos cerrados — [reason]." with time window for half-day closures
- [ ] 3.7 Hide the upcoming closures section entirely when no future closures exist

## 4. 44c — Danger Zone: Delete All Appointments

- [ ] 4.1 Write migration: `CREATE FUNCTION admin_delete_all_appointments()` SECURITY DEFINER, admin-only; DELETE all `appointments` for the org; return count of deleted rows
- [ ] 4.2 Grant `EXECUTE` on `admin_delete_all_appointments` to `authenticated`
- [ ] 4.3 Implement `adminDeleteAllAppointments(): Promise<number>` service function (calls the RPC, returns deleted count)
- [ ] 4.4 Add collapsible "Zona de peligro" section to `AdminSettingsPage` (business settings) with red border / warning palette
- [ ] 4.5 Implement first confirmation dialog: warning copy + "Continuar" / "Cancelar" buttons
- [ ] 4.6 Implement second confirmation dialog: text input requiring exactly "CONFIRMAR" before destructive button is enabled
- [ ] 4.7 Wire "Eliminar" button to `adminDeleteAllAppointments()`; show Spanish success message on resolve; show Spanish error message on reject

## 5. 44e — Delete User Edge Function (prerequisite migration first)

- [ ] 5.1 Write migration: `ALTER TABLE appointments ALTER COLUMN created_by_user_id DROP NOT NULL`
- [ ] 5.2 Create `supabase/functions/admin-delete-user/index.ts` Edge Function scaffold with CORS headers and Deno Supabase client setup
- [ ] 5.3 Implement JWT validation + `is_admin()` check in the Edge Function; return 401 on failure
- [ ] 5.4 Implement pre-deletion step 1: cancel `pending`/`confirmed` appointments where `customer_user_id = userId`; capture count
- [ ] 5.5 Implement pre-deletion step 2: set `created_by_user_id = NULL` where `created_by_user_id = userId`
- [ ] 5.6 Implement pre-deletion step 3: set `is_active = false` on `staff_members` where `profile_user_id = userId`
- [ ] 5.7 Implement pre-deletion step 4: call `supabase.auth.admin.deleteUser(userId)` using service-role client
- [ ] 5.8 Return `{ deletedUserId, cancelledAppointments }` on success; return named error response on failure
- [ ] 5.9 Add "Eliminar usuario" action button to each user row in `AdminUsersPage`
- [ ] 5.10 Implement confirmation dialog with exact copy: *"Esta acción eliminará permanentemente al usuario y su acceso. Sus turnos pasados quedarán sin nombre de cliente."* + "Eliminar" / "Cancelar" buttons
- [ ] 5.11 Wire "Eliminar" to `supabase.functions.invoke('admin-delete-user', { body: { userId } })`; remove user row from list on success; show Spanish error on failure
