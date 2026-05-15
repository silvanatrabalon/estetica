## MODIFIED Requirements

### Requirement: Service concurrent booking capacity is configurable
The system MUST allow admins to set an optional maximum number of concurrent bookings for a service. A null value means no limit. Any value set must be a positive integer (≥1). The `max_concurrent_bookings` value MUST be actively enforced by the slot generator RPC (`get_available_slots`): slots where the count of `pending` or `confirmed` appointments meets or exceeds this value MUST be excluded from the returned set.

#### Scenario: Admin sets a capacity limit on a service
- **WHEN** an authenticated admin saves a service with `max_concurrent_bookings` set to a valid integer ≥1
- **THEN** the system persists the value and displays it in the service form and list

#### Scenario: Admin clears the capacity limit
- **WHEN** an authenticated admin clears the capacity field and saves
- **THEN** the system persists null for `max_concurrent_bookings`, meaning no capacity restriction

#### Scenario: Invalid capacity value is rejected
- **WHEN** an admin submits a service with `max_concurrent_bookings` set to 0 or a negative number
- **THEN** the system rejects the submission and shows a Spanish validation message

#### Scenario: Null capacity is accepted
- **WHEN** an admin submits a service without specifying `max_concurrent_bookings`
- **THEN** the system accepts the submission and stores null (no capacity restriction)

#### Scenario: Slot generator enforces capacity cap
- **WHEN** `get_available_slots` evaluates a candidate slot and the count of `pending` or `confirmed` appointments at that time equals `services.max_concurrent_bookings`
- **THEN** that slot is excluded from the result

#### Scenario: Slot generator ignores null capacity
- **WHEN** `services.max_concurrent_bookings` is null
- **THEN** `get_available_slots` does not apply a capacity filter and returns all otherwise-valid slots

### Requirement: Global booking policy window is configurable
The system MUST allow admins to configure a global booking policy for the business: a minimum advance notice (in minutes) and a maximum booking horizon (in days). These define the boundaries within which customers can create bookings. Both values MUST be actively enforced by the slot generator RPC (`get_available_slots`): dates outside the horizon MUST return zero slots, and individual slots within the notice cutoff MUST be excluded.

#### Scenario: Admin saves valid booking policy values
- **WHEN** an authenticated admin saves valid `booking_min_notice_minutes` (0–10080) and `booking_max_horizon_days` (1–365)
- **THEN** the system persists both values on the organizations record and shows a Spanish success message

#### Scenario: Default policy values are in effect after migration
- **WHEN** the migration runs on an existing organization record
- **THEN** `booking_min_notice_minutes` defaults to 60 and `booking_max_horizon_days` defaults to 60

#### Scenario: Min notice out of range is rejected
- **WHEN** an admin submits `booking_min_notice_minutes` below 0 or above 10080
- **THEN** the system rejects the update and shows a Spanish validation message

#### Scenario: Horizon out of range is rejected
- **WHEN** an admin submits `booking_max_horizon_days` below 1 or above 365
- **THEN** the system rejects the update and shows a Spanish validation message

#### Scenario: Slot generator rejects date beyond horizon
- **WHEN** `get_available_slots` is called with a date more than `booking_max_horizon_days` calendar days from the current timestamp (in org timezone)
- **THEN** the function returns zero rows without evaluating staff or business hours

#### Scenario: Slot generator excludes slots inside notice cutoff
- **WHEN** `get_available_slots` generates candidate slots and a slot's `starts_at` is within `booking_min_notice_minutes` of `now()`
- **THEN** that slot is excluded from the result
