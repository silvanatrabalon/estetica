### Requirement: admin_get_stats_by_range RPC
The system SHALL expose an `admin_get_stats_by_range(p_date_from timestamptz, p_date_to timestamptz)` SECURITY DEFINER PostgreSQL function accessible only to authenticated users with the `admin` role, granted to `authenticated`. It MUST return a single row with: `pending_count bigint`, `confirmed_count bigint`, `cancelled_count bigint`, `completed_count bigint`, `total_count bigint`, `revenue_cents bigint`. The date window SHALL be applied to `appointments.starts_at` (inclusive on both ends). `revenue_cents` SHALL be the sum of `services.price_cents` for `completed` appointments in the range. All fields MUST return `0` (not NULL) when no matching rows exist.

#### Scenario: Admin calls RPC with valid range
- **WHEN** an authenticated admin calls `admin_get_stats_by_range` with `p_date_from` and `p_date_to`
- **THEN** the function returns one row with all fields populated and no NULLs

#### Scenario: Non-admin call rejected
- **WHEN** an authenticated non-admin calls `admin_get_stats_by_range`
- **THEN** the function raises a permission error

#### Scenario: No appointments in range
- **WHEN** no appointments have `starts_at` within the date window
- **THEN** all count fields and `revenue_cents` return `0`

#### Scenario: revenue_cents sums only completed appointments
- **WHEN** the range contains pending and completed appointments
- **THEN** `revenue_cents` includes only the `services.price_cents` of completed appointments

#### Scenario: Counts are accurate for mixed-status range
- **WHEN** the range contains 2 pending, 3 confirmed, 1 cancelled, and 4 completed appointments
- **THEN** `total_count = 10`, `pending_count = 2`, `confirmed_count = 3`, `cancelled_count = 1`, `completed_count = 4`

### Requirement: Admin Stats By Range Service Layer
The system SHALL provide `getStatsByRange(dateFrom: string, dateTo: string): Promise<StatsByRange>` in `src/services/adminDashboard.ts`. The `StatsByRange` TypeScript interface SHALL map the RPC columns in camelCase. The function SHALL throw on RPC error.

#### Scenario: Successful fetch
- **WHEN** `getStatsByRange('2026-01-01', '2026-01-31')` is called
- **THEN** it returns a resolved `StatsByRange` object with all fields as numbers

#### Scenario: RPC error propagated
- **WHEN** the RPC returns an error
- **THEN** `getStatsByRange()` throws

### Requirement: Range analytics are not shown on the dashboard
The RPC `admin_get_stats_by_range` and its service `getStatsByRange` remain available, but the admin dashboard MUST NOT render a date-range analytics section or preset selector.

#### Scenario: Dashboard does not request range analytics
- **WHEN** the admin dashboard loads
- **THEN** `getStatsByRange` is not called
