## Why

New services were created with an empty "Capacidad simultánea" field, which the system stores as `null` (unlimited). Admins who forgot to fill it in ended up with services that accept any number of overlapping bookings. Most services serve one customer at a time, so the safe default is 1.

## What Changes

- The create-service form pre-fills "Capacidad simultánea" with `1`.
- Clearing the field still means "no limit" (stored as `null`).
- Editing an existing service keeps its stored value; a service with no limit still shows an empty field (the default is never applied retroactively).
- No database change: the default lives in the form only.

## Capabilities

### Modified Capabilities
- `services-catalog-admin`: create form default for `max_concurrent_bookings`
- `service-booking-configuration`: documents that the default is a form-level default, not a database default

## User Flow

1. Admin opens "Nuevo servicio" → the capacity field shows `1`.
2. Admin saves without touching it → the service is stored with `max_concurrent_bookings = 1`.
3. Admin who wants unlimited capacity clears the field → stored as `null`.

## Data Model

No schema change. Existing rows are untouched.

## Acceptance Criteria

- Create form shows `1` in the capacity field.
- Saving the untouched create form sends `maxConcurrentBookings: 1`.
- Clearing the field sends `null`; `0` and negatives are still rejected.
- Editing a service with `null` capacity shows an empty field; with `3` shows `3`.
