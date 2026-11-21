## ADDED Requirements

### Requirement: Create form defaults service capacity to 1
The create-service form MUST pre-fill the "Capacidad simultánea" field with `1`. Clearing the field MUST still mean "no limit" and be stored as `null`. The default MUST NOT be applied when editing an existing service.

#### Scenario: Create form shows capacity 1
- **WHEN** an admin opens the create-service form
- **THEN** the capacity field contains `1`

#### Scenario: Saving the untouched form stores capacity 1
- **WHEN** an admin fills the required fields and saves without touching the capacity field
- **THEN** the service is created with `max_concurrent_bookings = 1`

#### Scenario: Admin clears the default to allow unlimited bookings
- **WHEN** an admin clears the capacity field and saves
- **THEN** the service is created with `max_concurrent_bookings = null`

#### Scenario: Editing a service without a limit does not apply the default
- **WHEN** an admin edits a service whose `max_concurrent_bookings` is null
- **THEN** the capacity field is empty, and saving without changes keeps it null

#### Scenario: Editing a service keeps its stored capacity
- **WHEN** an admin edits a service whose `max_concurrent_bookings` is 3
- **THEN** the capacity field shows `3`
