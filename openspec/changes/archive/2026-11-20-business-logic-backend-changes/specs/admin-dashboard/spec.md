## MODIFIED Requirements

### Requirement: Admin Dashboard Stats RPC
The system SHALL expose a `admin_get_dashboard_stats()` SECURITY DEFINER PostgreSQL function accessible only to authenticated users with the `admin` role. It MUST return a single row with the following integer/bigint fields: `today_count`, `week_count`, `month_count`, `pending_count`, `confirmed_count`, `cancelled_count`, `completed_count`, `revenue_cents_month`. The `no_show_count` field is **REMOVED** from the return shape. All count fields MUST return `0` (not NULL) when no matching rows exist. Time windows (today, this week, this month) MUST be computed using the organization's timezone from `organizations.timezone`, falling back to `UTC` if unset. **BREAKING**: this change requires a `DROP FUNCTION` + `CREATE` migration and must be deployed atomically with the TypeScript interface update and frontend stat card removal.

#### Scenario: Admin calls RPC
- **WHEN** an authenticated user with role `admin` calls `admin_get_dashboard_stats()`
- **THEN** the function returns one row with all KPI fields populated and no NULLs; the response does NOT include `no_show_count`

#### Scenario: Non-admin calls RPC
- **WHEN** an authenticated user without role `admin` calls `admin_get_dashboard_stats()`
- **THEN** the function raises a permission error

#### Scenario: No appointments exist
- **WHEN** `admin_get_dashboard_stats()` is called and there are no appointments in the org
- **THEN** all count fields return `0` and `revenue_cents_month` returns `0`

#### Scenario: Revenue computed from completed appointments this month
- **WHEN** there are completed appointments in the current calendar month
- **THEN** `revenue_cents_month` equals the SUM of `services.price_cents` for those appointments

#### Scenario: Revenue excludes non-completed appointments
- **WHEN** there are pending or cancelled appointments this month
- **THEN** `revenue_cents_month` does not include their price values

#### Scenario: Today boundary uses org timezone
- **WHEN** the org timezone is `America/Argentina/Buenos_Aires`
- **THEN** `today_count` counts only appointments whose date falls within today in that timezone, not UTC
