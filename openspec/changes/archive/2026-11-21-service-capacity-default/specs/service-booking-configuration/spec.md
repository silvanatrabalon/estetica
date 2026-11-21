## ADDED Requirements

### Requirement: Capacity default is a form default, not a database default
The `max_concurrent_bookings` column MUST remain nullable with no database default. The value `1` is pre-filled only by the create-service form. Existing services and services created through other paths keep `null` unless a value is set explicitly.

#### Scenario: No retroactive change to existing services
- **WHEN** the capacity default is introduced
- **THEN** services already stored with `max_concurrent_bookings = null` keep meaning "no limit"
