## Purpose
Admin configuration surface for three booking constraints: per-service specific date availability (15a), per-service concurrent booking capacity (15b), and global booking policy window (15c). These are prerequisites for the slot generator (#16) and booking flow (#17).
## Requirements
### Requirement: Admin can manage specific available dates per service
The system MUST allow admins to add and remove specific calendar dates when a service is available. If no dates are configured, the service has no date restriction. If dates are configured, the service is only bookable on those exact dates.

#### Scenario: Admin navigates to service availability management
- **WHEN** an authenticated admin clicks "Gestionar disponibilidad" on a service row in AdminServicesPage
- **THEN** the system navigates to `/admin/services/:serviceId/availability` and loads any configured dates for that service

#### Scenario: Service with no configured dates shows empty state
- **WHEN** an authenticated admin opens the availability page for a service with no configured dates
- **THEN** the system displays the empty state in Spanish indicating no date restrictions are configured

#### Scenario: Admin adds a specific available date
- **WHEN** an authenticated admin selects a valid date from the date picker and confirms the addition
- **THEN** the system calls `admin_add_service_available_date`, the date appears in the list, and a Spanish success message is shown

#### Scenario: Adding a duplicate date is rejected
- **WHEN** an authenticated admin attempts to add a date already present in the list
- **THEN** the database PK constraint rejects the insert and the system shows a Spanish error message

#### Scenario: Admin removes a specific available date
- **WHEN** an authenticated admin clicks the remove button on a listed date
- **THEN** the system calls `admin_remove_service_available_date`, the date is removed from the list, and a Spanish success message is shown

#### Scenario: Non-admin cannot access service availability management
- **WHEN** an authenticated non-admin user attempts to access `/admin/services/:serviceId/availability`
- **THEN** the system redirects them to `/unauthorized`

#### Scenario: Non-admin cannot directly write to service_available_dates
- **WHEN** an authenticated non-admin user attempts a direct INSERT or DELETE on `service_available_dates`
- **THEN** the database RLS policy rejects the operation

#### Scenario: Any authenticated user can read service_available_dates
- **WHEN** any authenticated user queries the `service_available_dates` table
- **THEN** the system returns the rows without error (enabling #16 slot generator to filter dates)

#### Scenario: Deleting a service cascades to its available dates
- **WHEN** a service is deleted from the database
- **THEN** all `service_available_dates` rows for that service are automatically removed via FK CASCADE

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

### Requirement: Booking configuration admin RPC functions are admin-only
The system MUST restrict all write operations on booking configuration data to authenticated admins via SECURITY DEFINER RPC functions.

#### Scenario: Admin RPC succeeds for authorized admin
- **WHEN** an authenticated admin calls any booking configuration admin RPC
- **THEN** the RPC executes successfully and modifies the target data

#### Scenario: Non-admin RPC call is rejected
- **WHEN** an authenticated non-admin calls any booking configuration admin RPC
- **THEN** the RPC raises a "No autorizado" exception

### Requirement: Spanish copy for all booking configuration UI states
The system MUST present all booking configuration UI copy in Spanish for loading, empty, success, and error states.

#### Scenario: All visible copy is in Spanish
- **WHEN** any state of the service availability management page or the booking policy section in Business Settings is visible
- **THEN** all visible user-facing copy is displayed in Spanish

### Requirement: Test coverage for service booking configuration
The system MUST include automated test coverage for all three booking configuration sub-concerns.

#### Scenario: Unit tests for validation logic pass
- **WHEN** unit tests run for capacity and policy validations
- **THEN** tests validate: null or ≥1 for `max_concurrent_bookings`; 0 and 10080 boundaries for notice; 1 and 365 boundaries for horizon

#### Scenario: Integration tests for date management pass
- **WHEN** integration tests run for AdminServiceAvailabilityPage
- **THEN** tests cover: loading state, empty state (no dates), date list renders, add action calls RPC and shows success, remove action calls RPC and removes row, error on RPC failure shows Spanish message

#### Scenario: Integration tests for capacity field pass
- **WHEN** integration tests run for AdminServicesPage
- **THEN** tests cover: capacity field renders in service form, valid value is saved, invalid value shows Spanish error, clearing the field saves null

#### Scenario: Integration tests for booking policy section pass
- **WHEN** integration tests run for BusinessSettingsPage
- **THEN** tests cover: "Configuración de reservas" section renders with current values, valid save succeeds, boundary violations show Spanish validation messages

#### Scenario: SQL smoke tests pass
- **WHEN** database smoke tests run for service booking configuration
- **THEN** tests validate: CHECK constraint rejects invalid capacity values; PK rejects duplicate (service_id, available_date); admin RPCs succeed; non-admin direct write on service_available_dates is denied

