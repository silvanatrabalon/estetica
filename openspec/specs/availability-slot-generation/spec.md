# availability-slot-generation Specification

## Purpose
TBD - created by archiving change availability-slot-generation. Update Purpose after archive.
## Requirements
### Requirement: get_available_slots RPC returns available time slots
The system SHALL expose a SECURITY DEFINER PostgreSQL function `get_available_slots(p_service_id uuid, p_date date)` returning `TABLE(starts_at timestamptz, ends_at timestamptz)`. The function MUST be callable by `authenticated` users only. An empty result means no slots are available on that date.

#### Scenario: Date outside booking horizon returns no slots
- **WHEN** `get_available_slots` is called with a date beyond `organizations.booking_max_horizon_days` from now
- **THEN** the function returns zero rows

#### Scenario: Date before minimum notice cutoff returns no slots
- **WHEN** `get_available_slots` is called with a date where all generated slots fall within `organizations.booking_min_notice_minutes` of now
- **THEN** the function returns zero rows

#### Scenario: Date not in service whitelist returns no slots
- **WHEN** `get_available_slots` is called for a service with configured `service_available_dates` and the requested date is not in that set
- **THEN** the function returns zero rows

#### Scenario: Date in service whitelist returns slots
- **WHEN** `get_available_slots` is called for a service with configured `service_available_dates` and the requested date is in that set
- **THEN** the function proceeds to evaluate staff and business hours for that date

#### Scenario: Business closed on requested date returns no slots
- **WHEN** `get_available_slots` is called for a date where the `business_hours` row for that weekday is absent or where a `business_closure_exceptions` row covers that date
- **THEN** the function returns zero rows

#### Scenario: No active staff assigned to service returns no slots
- **WHEN** `get_available_slots` is called and no `staff_services` rows link active staff to the requested service
- **THEN** the function returns zero rows

#### Scenario: Staff with no schedule rows returns no slots for that staff
- **WHEN** a staff member is assigned to the service but has no `staff_schedules` row for the requested weekday and no relevant `staff_schedule_exceptions` row
- **THEN** that staff member contributes zero candidate slots (other staff are unaffected)

#### Scenario: Candidate slots are generated at 30-minute intervals
- **WHEN** a staff member's working window intersected with business hours is `[09:00, 17:00)` and the service duration is 60 minutes
- **THEN** the function generates candidate slots at 09:00, 09:30, 10:00 … up to the last slot where `slot_start + duration ≤ 17:00` (16:00 is the last valid start)

#### Scenario: Overflow slots are excluded
- **WHEN** a candidate slot's `starts_at + service.duration_minutes` would extend beyond the working window end
- **THEN** that slot is not included in the result

#### Scenario: Slots overlapping an existing appointment are excluded
- **WHEN** a candidate slot `[s, e)` overlaps an existing `pending` or `confirmed` appointment `[a_start, a_end)` for the assigned staff member (`s < a_end AND e > a_start`)
- **THEN** that slot is excluded for that staff member (but other staff who do not have the conflict may still cover it)

#### Scenario: Slots at or above capacity are excluded
- **WHEN** the number of `confirmed` or `pending` appointments at a candidate slot time meets or exceeds `services.max_concurrent_bookings`
- **THEN** that slot is not returned

#### Scenario: Slot returned if at least one staff member is free
- **WHEN** multiple staff are assigned and at least one staff member survives all filters for a candidate slot
- **THEN** that slot is included in the result exactly once

#### Scenario: Unauthenticated call is rejected
- **WHEN** an unauthenticated request calls `get_available_slots`
- **THEN** the database rejects the call (no EXECUTE permission for `anon` role)

### Requirement: TypeScript service layer exposes slot fetching
The system SHALL provide `getAvailableSlots(serviceId: string, date: string): Promise<AvailableSlot[]>` in `src/services/availability.ts` where `AvailableSlot` is `{ starts_at: string; ends_at: string }`. The function MUST call `supabase.rpc('get_available_slots', ...)` and throw on error.

#### Scenario: Successful RPC call returns typed slot array
- **WHEN** `getAvailableSlots` is called with a valid service ID and ISO date string
- **THEN** it returns an array of `AvailableSlot` objects or an empty array if no slots are available

#### Scenario: RPC error propagates as a thrown error
- **WHEN** the RPC returns an error
- **THEN** `getAvailableSlots` throws the error so the calling hook can surface it

### Requirement: useAvailableSlots hook manages slot loading state
The system SHALL provide `useAvailableSlots(serviceId: string | null, date: string | null)` returning `{ slots: AvailableSlot[]; loading: boolean; error: string | null }`. The hook MUST only call the service when both `serviceId` and `date` are non-null.

#### Scenario: Hook is idle when inputs are null
- **WHEN** `useAvailableSlots(null, null)` is rendered
- **THEN** `slots` is empty, `loading` is false, `error` is null, and no RPC is called

#### Scenario: Hook fetches when both inputs are provided
- **WHEN** `useAvailableSlots` is called with valid `serviceId` and `date`
- **THEN** `loading` is true while the RPC is in-flight and resolves to `{ slots, loading: false, error: null }` on success

#### Scenario: Hook resets slots and refetches when inputs change
- **WHEN** either `serviceId` or `date` changes
- **THEN** the hook resets `slots` to empty and fires a new fetch

#### Scenario: Hook surfaces fetch error in Spanish
- **WHEN** the RPC returns an error
- **THEN** `error` is set to a Spanish error string and `loading` is false

### Requirement: useActiveServices hook supplies service selector data
The system SHALL provide `useActiveServices()` returning `{ services: Service[]; loading: boolean; error: string | null }` where only services with `is_active = true` are included.

#### Scenario: Hook returns only active services
- **WHEN** `useActiveServices` is called
- **THEN** only services where `is_active = true` are returned

#### Scenario: Hook surfaces fetch error in Spanish
- **WHEN** the Supabase query returns an error
- **THEN** `error` is set to a Spanish error string and `loading` is false

### Requirement: formatSlotTime formats UTC timestamps in org timezone
The system SHALL provide `formatSlotTime(isoUtc: string, orgTimezone: string): string` using `Intl.DateTimeFormat`. An invalid or missing `orgTimezone` MUST fall back to `'UTC'`.

#### Scenario: Correctly formats time in org timezone
- **WHEN** `formatSlotTime('2025-06-10T14:00:00Z', 'America/Bogota')` is called
- **THEN** it returns a human-readable local time string in the `America/Bogota` timezone (e.g., "9:00 a.m.")

#### Scenario: Falls back to UTC for invalid timezone
- **WHEN** `formatSlotTime` is called with an empty or invalid timezone string
- **THEN** it uses `'UTC'` for formatting without throwing

### Requirement: Customer booking wizard presents 3-step slot selection
The system SHALL replace the `/booking` route stub with a 3-step wizard: (1) service selector, (2) date picker, (3) slot grid. The route MUST be protected (`customer` role). All user-facing copy MUST be in Spanish.

#### Scenario: Unauthenticated user is redirected from /booking
- **WHEN** an unauthenticated user navigates to `/booking`
- **THEN** the routing layer redirects them to `/signin`

#### Scenario: Non-customer authenticated user is redirected
- **WHEN** an authenticated user without the `customer` role navigates to `/booking`
- **THEN** the routing layer redirects them to `/unauthorized`

#### Scenario: Step 1 shows active services
- **WHEN** an authenticated customer lands on `/booking`
- **THEN** the wizard shows step 1 with a list of active services and a loading state while services are fetching

#### Scenario: Step 2 is unlocked after service selection
- **WHEN** the customer selects a service in step 1
- **THEN** the wizard advances to step 2 and shows a date picker constrained to the booking horizon

#### Scenario: Step 3 is unlocked after date selection
- **WHEN** the customer selects a date in step 2
- **THEN** the wizard advances to step 3 and shows a loading state while `useAvailableSlots` fetches

#### Scenario: Step 3 displays available slots
- **WHEN** `useAvailableSlots` resolves with one or more slots
- **THEN** each slot is displayed as a selectable button showing the formatted local time in Spanish

#### Scenario: Step 3 displays empty state when no slots
- **WHEN** `useAvailableSlots` resolves with zero slots
- **THEN** the wizard displays a Spanish empty state message (e.g., "No hay horarios disponibles para esta fecha")

#### Scenario: Step 3 displays error state on fetch failure
- **WHEN** `useAvailableSlots` resolves with an error
- **THEN** the wizard displays a Spanish error message

#### Scenario: Selecting a slot is the final step of this wizard
- **WHEN** the customer taps/clicks a slot in step 3
- **THEN** the selected slot (`starts_at`, `ends_at`) is held in component state ready for booking creation (#17); no navigation occurs in this change

### Requirement: SQL tests cover slot generator correctness
The system MUST include a `supabase/tests/availability_slot_generation.sql` file that smoke-tests the RPC against seeded fixture data.

#### Scenario: Happy-path test returns expected slot count
- **WHEN** the SQL test seeds a service, staff schedule, business hours, and no conflicting appointments, then calls `get_available_slots`
- **THEN** the result row count matches the expected slot count for the configured hours and service duration

#### Scenario: Conflicting appointment reduces available slots
- **WHEN** the SQL test seeds one conflicting appointment and calls `get_available_slots`
- **THEN** the conflicted slot is absent from the result

#### Scenario: Business closure returns zero slots
- **WHEN** the SQL test seeds a `business_closure_exceptions` row for the test date and calls `get_available_slots`
- **THEN** zero rows are returned

