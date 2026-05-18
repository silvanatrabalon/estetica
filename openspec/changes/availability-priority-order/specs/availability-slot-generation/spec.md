## ADDED Requirements

### Requirement: get_available_slots evaluates availability in canonical priority order
The system SHALL evaluate availability conditions in the following order: (1) service availability, (2) staff availability, (3) business hours. Each layer acts as a gate: if a layer eliminates all candidates, the function returns zero rows without evaluating subsequent layers. Business hours SHALL always be a hard gate — a business closed day returns zero rows even if staff has working hours configured for that day.

#### Scenario: Service available dates gate fires before business hours gate
- **WHEN** `get_available_slots` is called for a service with `service_available_dates` configured and the requested date is NOT in that set, but the business IS open on that day
- **THEN** the function returns zero rows (service gate fires before business hours is queried)

#### Scenario: Business hours gate fires after service available dates gate
- **WHEN** `get_available_slots` is called for a service with `service_available_dates` configured and the requested date IS in that set, but the business is CLOSED on that day
- **THEN** the function returns zero rows (business hours gate fires after service_available_dates is satisfied)

#### Scenario: Staff absence fires before business hours clip matters
- **WHEN** `get_available_slots` is called, service available dates allow the date, but NO active staff member assigned to the service has a working schedule or custom hours for that day
- **THEN** the function returns zero rows (staff layer eliminates all slots before business hours intersection)
