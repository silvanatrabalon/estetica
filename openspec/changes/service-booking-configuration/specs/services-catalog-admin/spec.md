## ADDED Requirements

### Requirement: Service Availability Link Per Service Row
The system MUST display a "Gestionar disponibilidad" action link per row in the admin service list that navigates to the per-service date management sub-route.

#### Scenario: Admin sees availability link in service list
- **WHEN** an authenticated admin views the service catalog at `/admin/services`
- **THEN** each service row includes a "Gestionar disponibilidad" link alongside other actions

#### Scenario: Availability link navigates to correct sub-route
- **WHEN** an admin clicks "Gestionar disponibilidad" on a service row
- **THEN** the system navigates to `/admin/services/:serviceId/availability` for that service

## MODIFIED Requirements

### Requirement: Service Field Validation
The system SHALL enforce validation rules on service fields before persisting them.

#### Scenario: Name is required and minimum length
- **WHEN** an admin submits a service with an empty name or a name shorter than 2 characters
- **THEN** the system rejects the submission and shows a Spanish validation message

#### Scenario: Duration must be a positive integer within range
- **WHEN** an admin submits a service with duration_minutes less than 1 or greater than 480
- **THEN** the system rejects the submission and shows a Spanish validation message

#### Scenario: Price must be a non-negative value
- **WHEN** an admin submits a service with a negative price
- **THEN** the system rejects the submission and shows a Spanish validation message

#### Scenario: Image URL is optional
- **WHEN** an admin submits a service without an image URL
- **THEN** the system accepts the submission with a null image_url

#### Scenario: Image URL is validated as a URL when provided
- **WHEN** an admin submits a service with an image URL that is not a valid URL format
- **THEN** the system rejects the submission and shows a Spanish validation message

#### Scenario: max_concurrent_bookings must be null or a positive integer
- **WHEN** an admin submits a service with max_concurrent_bookings set to 0 or a negative number
- **THEN** the system rejects the submission and shows a Spanish validation message

#### Scenario: max_concurrent_bookings is optional
- **WHEN** an admin submits a service without specifying max_concurrent_bookings
- **THEN** the system accepts the submission and stores null (no capacity restriction)
