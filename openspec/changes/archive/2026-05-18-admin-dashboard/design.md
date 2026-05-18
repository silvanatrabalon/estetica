## Context

The admin role currently has no dedicated home experience — after login the user lands on `/admin/users` (user management). Operational information (today's bookings, KPIs, quick navigation) requires navigating to separate pages. The admin dashboard addresses this by providing a single operational command center as the default admin entry point.

Dependencies already in the codebase:
- `adminListAppointments` in `src/services/adminAppointments.ts` (#23 ✅)
- `AdminCalendarPage` at `/admin/calendar` (#25 ✅)
- `organizations.timezone` column (#10 ✅)

## Goals / Non-Goals

**Goals:**
- Surface today's appointments and booking KPIs without leaving the admin home
- Aggregate stats server-side using org timezone for correctness
- Provide quick-access navigation cards to the most-used admin sections
- Move admin landing route from `/admin/users` to `/admin/dashboard`
- Remove Reports from admin nav (route stays registered; just unlinked)

**Non-Goals:**
- Charting / visualization library (no recharts, chart.js, etc.)
- Historical trend analysis or date-range selectors
- Real-time / subscription-based updates (page-load fetch is sufficient for MVP)
- Storing aggregated stats — all values are computed on demand
- Modifying the `/admin/reports` page itself

## Decisions

### 1. Stats via SECURITY DEFINER RPC, not client-side aggregation

**Decision**: `admin_get_dashboard_stats()` is a SECURITY DEFINER PostgreSQL function called via Supabase RPC.

**Rationale**: Aggregating in the DB avoids shipping all appointment rows to the client and ensures timezone-correct window boundaries (TODAY in `organizations.timezone`). A SECURITY DEFINER function with an internal admin-role check is more secure than relying solely on RLS for aggregate queries.

**Alternatives considered**: Client-side aggregation over `adminListAppointments` — rejected because it pulls all rows just to count them, and timezone handling becomes frontend-only.

### 2. Revenue = price-at-query from `services.price_cents`

**Decision**: `revenue_cents_month` JOINs `services.price_cents` at query time for `completed` appointments this month. No `price_at_booking` snapshot column.

**Rationale**: A snapshot column requires a migration touching the appointments insert path — out of scope for this change. The caveat (revenue is approximate if prices change) is documented in the RPC and in the service layer.

**Alternatives considered**: Add `price_cents_at_booking` snapshot — deferred to a future billing/invoicing change.

### 3. Reuse `adminListAppointments` for today's widget

**Decision**: The "today's appointments" widget calls the existing `adminListAppointments` service function with `dateFrom`/`dateTo` set to today in org timezone.

**Rationale**: Avoids a second RPC; the existing function already handles pagination and filters.

### 4. Remove Reports from nav, keep route registered

**Decision**: Remove `reports` from `navigationByRole.admin` in `navigation.ts`; leave `AdminReportsPage` and its route in `App.tsx` untouched.

**Rationale**: The page is a stub; hiding it from nav reduces clutter without deleting work. A future change can restore it when reports are built out.

### 5. No charting library

**Decision**: Status breakdown is a simple table. KPI cards are plain numbers.

**Rationale**: A charting library adds bundle weight for data that can be read clearly in tabular form at this stage. A future visual-polish change can add charts if needed.

## Risks / Trade-offs

- [Revenue accuracy] `revenue_cents_month` reflects current service prices, not historical booking prices → Mitigation: add `-- NOTE: price-at-query` comment in migration and in `adminDashboard.ts`
- [Timezone edge case] `TODAY` boundary is computed from `organizations.timezone`; if no timezone is set, falls back to UTC → Mitigation: the `admin_get_dashboard_stats` RPC should use `COALESCE(org.timezone, 'UTC')` and document the fallback
- [Breaking redirect] Changing `roleHomeByRole.admin` breaks the routing policy test → Mitigation: update the test in the same PR; the change is explicit in the proposal

## Migration Plan

1. Run new migration (`admin_get_dashboard_stats` function) in Supabase
2. Deploy frontend changes (new page, updated nav, updated routing)
3. No data migration required — all aggregates are computed on demand
4. Rollback: revert `roleHomeByRole.admin` to `/admin/users` and remove nav item; the RPC can stay (it's additive)
