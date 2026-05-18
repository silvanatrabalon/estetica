## ADDED Requirements

### Requirement: get_upcoming_closures RPC
The system SHALL expose a `get_upcoming_closures()` SECURITY DEFINER PostgreSQL function accessible to `anon` and `authenticated` roles. It MUST return rows from `business_closure_exceptions` where `closure_date >= CURRENT_DATE AND closure_date <= CURRENT_DATE + 30`, ordered by `closure_date ASC`. The returned columns SHALL be: `closure_date date`, `closure_type text` (`'full_day'` or `'half_day'`), `starts_at time`, `ends_at time`, `reason text`. `anon` SHALL have no direct SELECT grant on `business_closure_exceptions`; the RPC is the only public read path.

#### Scenario: No closures in next 30 days
- **WHEN** `get_upcoming_closures()` is called and no rows exist within the 30-day window
- **THEN** the function returns an empty result set (no error)

#### Scenario: Today is a full-day closure
- **WHEN** `get_upcoming_closures()` is called and today matches a `closure_type = 'full_day'` row
- **THEN** that row is included with `closure_date = today`

#### Scenario: Future closure within 30 days
- **WHEN** a closure exists with `closure_date = today + 15`
- **THEN** the row appears in the result set ordered by `closure_date ASC`

#### Scenario: Closure beyond 30 days excluded
- **WHEN** a closure exists with `closure_date = today + 31`
- **THEN** that row does NOT appear in the result set

#### Scenario: Anon access permitted
- **WHEN** an unauthenticated caller invokes `get_upcoming_closures()`
- **THEN** the function returns results without error (no auth required)

### Requirement: Business Closure Service Layer
The system SHALL provide `getUpcomingClosures(): Promise<UpcomingClosure[]>` in `src/services/landing.ts` (or a dedicated `closures.ts` module). The `UpcomingClosure` interface SHALL map the RPC columns in camelCase.

#### Scenario: Successful fetch
- **WHEN** `getUpcomingClosures()` is called
- **THEN** it returns an array of `UpcomingClosure` objects; an empty array if no closures exist

#### Scenario: RPC error propagated
- **WHEN** the Supabase RPC returns an error
- **THEN** `getUpcomingClosures()` throws with the error detail

### Requirement: Landing Page — Today's Closure Banner
The landing page SHALL display a non-dismissible banner above the hero section when today matches an active `business_closure_exceptions` row. For a `full_day` closure the banner SHALL read: **"Hoy estamos cerrados."** For a `half_day` closure the banner SHALL read: **"Hoy cerrado de HH:MM a HH:MM."** (24-hour format, times from `starts_at` and `ends_at`). The banner SHALL have no dismiss/close button.

#### Scenario: Today is a full-day closure
- **WHEN** `getUpcomingClosures()` returns a row with `closureDate = today` and `closureType = 'full_day'`
- **THEN** the banner "Hoy estamos cerrados." is rendered above the hero

#### Scenario: Today is a half-day closure
- **WHEN** `getUpcomingClosures()` returns a row with `closureDate = today` and `closureType = 'half_day'`
- **THEN** the banner "Hoy cerrado de HH:MM a HH:MM." is rendered with the correct times

#### Scenario: No active closure today
- **WHEN** no closure row has `closureDate = today`
- **THEN** no banner is rendered above the hero

#### Scenario: Banner has no dismiss button
- **WHEN** the closure banner is visible
- **THEN** there is no button or control to hide or dismiss it

### Requirement: Landing Page — Upcoming Closures List
The landing page SHALL display a list of future closures (where `closureDate > today`) in a section above the footer. Each item SHALL state: "El [fecha legible] estaremos cerrados — [reason]." For partial-day closures the item SHALL append " (de HH:MM a HH:MM)". The section SHALL only render if at least one future closure exists.

#### Scenario: Future full-day closure with reason
- **WHEN** `getUpcomingClosures()` returns a row with `closureDate > today`, `closureType = 'full_day'`, and `reason = 'Feriado nacional'`
- **THEN** the list item reads "El [fecha] estaremos cerrados — Feriado nacional."

#### Scenario: Future half-day closure
- **WHEN** `getUpcomingClosures()` returns a row with `closureDate > today` and `closureType = 'half_day'`
- **THEN** the list item includes the time window "(de HH:MM a HH:MM)"

#### Scenario: No future closures — section hidden
- **WHEN** no closures have `closureDate > today`
- **THEN** the upcoming closures section is not rendered

#### Scenario: Multiple upcoming closures ordered by date
- **WHEN** multiple future closure rows exist
- **THEN** they are displayed in ascending `closureDate` order
