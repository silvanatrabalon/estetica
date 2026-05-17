## MODIFIED Requirements

### Requirement: Admin Service Catalog Management
The system SHALL allow admins to create, edit, deactivate, and reactivate services through an admin-only panel. Hard deletes are not permitted — services with linked appointments cannot be removed.

#### Scenario: Admin views the service catalog
- **WHEN** an authenticated user with active role `admin` navigates to `/admin/services`
- **THEN** the system displays all services for the organization with their name, duration, price, image thumbnail (or placeholder), description preview (truncated), and active status

#### Scenario: Admin creates a new service
- **WHEN** an admin submits the create form with a valid name, duration, and price
- **THEN** the system inserts a new service record and displays it in the list; description and image_url default to null

#### Scenario: Duplicate service name is rejected
- **WHEN** an admin attempts to create a service with a name that already exists for the organization
- **THEN** the system rejects the operation and shows a Spanish error message

#### Scenario: Admin edits an existing service
- **WHEN** an admin modifies the name, duration, price, description, or image of an existing service and saves
- **THEN** the system updates the record and reflects the changes in the list

#### Scenario: Admin deactivates a service
- **WHEN** an admin deactivates an active service
- **THEN** the service is marked as inactive and the status badge updates accordingly

#### Scenario: Admin reactivates a service
- **WHEN** an admin reactivates an inactive service
- **THEN** the service is marked as active and is again available for use in the booking flow

#### Scenario: Non-admin cannot access the service catalog panel
- **WHEN** an authenticated user without active role `admin` attempts to access `/admin/services`
- **THEN** the system redirects them to `/unauthorized`

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

#### Scenario: Description is optional and has no length validation
- **WHEN** an admin submits a service with an empty or absent description
- **THEN** the system accepts the submission with description = null

#### Scenario: Image is optional (no image_url text input)
- **WHEN** an admin submits a service without uploading an image
- **THEN** the system accepts the submission with image_url = null

#### Scenario: max_concurrent_bookings must be null or a positive integer
- **WHEN** an admin submits a service with max_concurrent_bookings set to 0 or a negative number
- **THEN** the system rejects the submission and shows a Spanish validation message

#### Scenario: max_concurrent_bookings is optional
- **WHEN** an admin submits a service without specifying max_concurrent_bookings
- **THEN** the system accepts the submission and stores null (no capacity restriction)

## REMOVED Requirements

### Requirement: Service Image URL
**Reason**: The free-text `image_url` input is replaced by the `service-image-upload` capability. Admins no longer type a URL — they upload a file. The `image_url` column and data contract remain unchanged; only the input widget is replaced.
**Migration**: No data migration required. Existing `image_url` values are preserved. New uploads populate `image_url` with a Supabase Storage public URL automatically.
