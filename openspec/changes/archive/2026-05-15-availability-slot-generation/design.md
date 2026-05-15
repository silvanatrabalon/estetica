## Context

All booking configuration prerequisites are in place: `staff_schedules`, `staff_schedule_exceptions`, `business_hours`, `business_closure_exceptions`, `service_available_dates`, `staff_services`, `appointments`, and the policy columns (`booking_min_notice_minutes`, `booking_max_horizon_days`, `max_concurrent_bookings`). The `/booking` route exists as a stub page. There is currently no mechanism to compute which time slots are actually bookable — the data exists but nothing aggregates it into a usable set of available times for customers.

This design covers the slot generator RPC, its service layer and hooks, and the customer-facing booking wizard (slot selection only). Booking creation, double-booking prevention, and confirmation are handled in changes #17/#18 and #19.

## Goals / Non-Goals

**Goals:**
- Implement a single SECURITY DEFINER RPC that returns available `(starts_at, ends_at)` UTC pairs for a given service and date
- Enforce all booking constraints entirely server-side (staff schedules, business hours, capacity, policy window, notice cutoff)
- Provide a TypeScript service layer and React hooks that the booking wizard consumes
- Replace the `/booking` route stub with a 3-step customer wizard: service selector → date picker → slot grid
- All customer-facing copy in Spanish

**Non-Goals:**
- Booking creation (INSERT into `appointments`) — handled in #17
- Staff selection by customer — staff is auto-assigned server-side at booking time (#17)
- Recurring schedule generation or slot caching
- Admin availability override UI
- Email notifications — handled in #27

## Decisions

### Decision: Single aggregating RPC vs. per-staff RPC

**Chosen**: Single `get_available_slots(p_service_id uuid, p_date date)` returning union across all staff. The customer never picks a staff member; the function returns a slot as available if **at least one** active assigned staff member can cover it. Staff assignment happens at booking time (#17: first available by `staff_members.created_at ASC`).

**Alternatives considered**:
- Per-staff RPC with a UNION in the service layer — pushes aggregation logic to the frontend; unnecessarily exposes internal staff state to the client.
- Two-phase: first fetch staff list, then fetch per-staff slots — more round trips, no UX benefit since the customer never sees staff names.

### Decision: 30-minute fixed slot interval

**Chosen**: Hardcoded `interval '30 minutes'` constant inside the RPC. Named in a comment as `SLOT_INTERVAL` for future extraction if needed.

**Alternatives considered**:
- Configurable per-service slot interval — adds an `organizations` or `services` column, extra UI, and migrations. Not needed at MVP stage; all current service durations are multiples of 30 minutes.
- 15-minute slots — finer granularity than any configured service duration; generates slots that always overflow for short services.

### Decision: Slot generator placement — PostgreSQL function vs. Edge Function

**Chosen**: SECURITY DEFINER PostgreSQL function called via `supabase.rpc()`. Keeps all constraint logic co-located with the data (no network hop between constraint tables and generator logic), benefits from PostgreSQL's efficient set operations, and avoids cold starts.

**Alternatives considered**:
- Supabase Edge Function — requires secrets only if calling external APIs; none needed here. Adds cold start latency for a read-only operation.
- Client-side generation — would require fetching raw schedule and appointment data to the browser, violating the principle of not exposing internal state and introducing a large attack surface.

### Decision: Business hours as a hard gate

**Chosen**: A missing `business_hours` row for a given weekday means the business is closed that day. Staff working windows are intersected with business hours; no intersection → no slots. Business closures (`business_closure_exceptions`) override even valid staff schedules.

**Alternatives considered**:
- Missing business hours = no restriction — makes the common case (closed day) require a positive "closed" configuration, inverting the model.

### Decision: Pipeline ordering — filter early vs. filter late

**Chosen**: Apply the policy window (step 1) and date whitelist (step 2) as early exits before any slot arithmetic. This means calls for obviously out-of-range dates return immediately without touching `staff_schedules` or `appointments`.

**Rationale**: Policy checks are cheap table lookups. Failing fast reduces query cost for the common case of customers probing dates outside the booking horizon.

### Decision: Slot overlap check — approximate vs. exact

**Chosen**: Exact overlap: a candidate slot `[s, e)` conflicts with an existing appointment `[a_start, a_end)` when `s < a_end AND e > a_start`. Uses a half-open interval model.

**Alternatives considered**:
- Exclusive end: `s < a_end AND e > a_start` is already half-open; this is the standard. Inclusive end would double-count boundary slots.

### Decision: Frontend date selection — native `<input type="date">` vs. third-party calendar

**Chosen**: Native HTML `<input type="date">` styled with Tailwind for the MVP date picker. No third-party library dependency.

**Alternatives considered**:
- `react-day-picker` or similar — adds dependency weight. The native input is sufficient for the MVP booking step and avoids a new dependency.

### Decision: Timezone display — `Intl.DateTimeFormat` vs. third-party

**Chosen**: `formatSlotTime(isoUtc, orgTimezone)` implemented using `Intl.DateTimeFormat` with `timeZone` option. No `dayjs`, `date-fns`, or `luxon` dependency.

**Alternatives considered**:
- `date-fns-tz` — functional API but adds ~20 KB. `Intl.DateTimeFormat` is native in all target browsers and handles the same IANA timezone strings stored in `organizations.timezone`.

## Risks / Trade-offs

- **Risk: No optimistic lock at slot read time** → A slot shown as available can be taken between the customer's view and their booking submission. Mitigation: #17/#18 use a `btree_gist` exclusion constraint for atomic conflict detection at INSERT time. The slot generator is intentionally read-only and stateless.
- **Risk: RPC performance on large appointment tables** → The overlap query (`appointments` join) grows with appointment volume. Mitigation: `appointments(staff_id, starts_at, ends_at)` index already exists from the foundation schema. Monitor as volume grows.
- **Risk: Missing `organizations.timezone`** → If the org record has no timezone, UTC is used as fallback, which may show incorrect local times. Mitigation: `formatSlotTime` falls back to `'UTC'` and logs a warning; the Business Settings profile page (#14) should ensure timezone is set before going live.
- **Risk: Stub BookingPage currently rendered for non-auth users** → The existing stub may be accessible without auth. Mitigation: 16e confirms `BookingPage` is wrapped in the `<ProtectedRoute role="customer">` guard (already defined in the routing layer).

## Migration Plan

1. Deploy migration adding `get_available_slots` function (16a) to Supabase via `supabase db push`.
2. Extend with service whitelist + capacity check (16b) as a second migration — `CREATE OR REPLACE FUNCTION` is safe to run; no table DDL changes.
3. Extend with policy window + notice cutoff (16c) — same `CREATE OR REPLACE` pattern.
4. Deploy frontend changes (16d service layer + hooks, 16e wizard) via Vercel. No data migration required; all tables already exist.

**Rollback**: Because all new DB work is a function (`CREATE OR REPLACE`), rollback is `DROP FUNCTION get_available_slots(uuid, date)`. Frontend rollback is a Vercel redeploy of the previous commit.

## Open Questions

- None. All architecture decisions have been resolved per the #16 spec exploration session.
