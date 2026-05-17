## ADDED Requirements

### Requirement: Admin Service Catalog Management
The system SHALL allow admins to create, edit, deactivate, and reactivate services through an admin-only panel. Hard deletes are not permitted — services with linked appointments cannot be removed. The create/edit form MUST include a "Categoría" dropdown populated from `admin_list_categories()`. `admin_create_service()` and `admin_update_service()` MUST accept and persist `p_category_id uuid` (nullable). `admin_list_services()` MUST return `category_id` and `category_name` for each service.

#### Scenario: Admin views the service catalog
- **WHEN** an authenticated user with active role `admin` navigates to `/admin/services`
- **THEN** the system displays all services for the organization with their name, duration, price, image thumbnail (or placeholder), description preview (truncated), category name (or "Sin categoría"), and active status

#### Scenario: Admin creates a new service
- **WHEN** an admin submits the create form with a valid name, duration, and price
- **THEN** the system inserts a new service record and displays it in the list; description, image_url, and category_id default to null

#### Scenario: Admin creates a service with a category
- **WHEN** an admin selects a category from the dropdown and submits the form
- **THEN** the new service is created with the selected `category_id` and the category name appears in the list

#### Scenario: Duplicate service name is rejected
- **WHEN** an admin attempts to create a service with a name that already exists for the organization
- **THEN** the system rejects the operation and shows a Spanish error message

#### Scenario: Admin edits an existing service
- **WHEN** an admin modifies the name, duration, price, description, image, or category of an existing service and saves
- **THEN** the system updates the record and reflects the changes in the list

#### Scenario: Admin deactivates a service
- **WHEN** an admin deactivates an active service
- **THEN** the service is marked as inactive and the status badge updates accordingly

#### Scenario: Admin reactivates a service
- **WHEN** an admin reactivates an inactive service
- **THEN** the service is marked as active and is again available for use in the booking flow

#### Scenario: Non-admin cannot access the service catalog panel
- **WHEN** a non-admin user attempts to access `/admin/services`
- **THEN** they are redirected to `/unauthorized`

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

### Requirement: Service Availability Link Per Service Row
The system MUST display a "Gestionar disponibilidad" action link per row in the admin service list that navigates to the per-service date management sub-route.

#### Scenario: Admin sees availability link in service list
- **WHEN** an authenticated admin views the service catalog at `/admin/services`
- **THEN** each service row includes a "Gestionar disponibilidad" link alongside other actions

#### Scenario: Availability link navigates to correct sub-route
- **WHEN** an admin clicks "Gestionar disponibilidad" on a service row
- **THEN** the system navigates to `/admin/services/:serviceId/availability` for that service

### Requirement: Service Data Access for Authenticated Users
The system SHALL allow all authenticated roles (customer, staff, admin) to read the service catalog. Direct data manipulation is not permitted — all mutations go through admin-only RPC functions.

#### Scenario: Authenticated user can read services
- **WHEN** any authenticated user queries the `services` table
- **THEN** the system returns the service records without error

#### Scenario: Authenticated non-admin cannot directly mutate services
- **WHEN** an authenticated user without admin role attempts a direct INSERT, UPDATE, or DELETE on the `services` table
- **THEN** the database rejects the operation

#### Scenario: Admin RPC functions are callable only by admins
- **WHEN** a non-admin authenticated user calls an admin service RPC function
- **THEN** the database raises a permission error

### Requirement: Service Price Display
The system SHALL display prices in ARS currency format. A price of zero is a valid service price.

#### Scenario: Price is displayed in ARS format
- **WHEN** a service price is displayed in the admin panel
- **THEN** the system formats it as ARS currency (e.g., `$1.500,00`)

#### Scenario: Zero price is displayed as a valid price
- **WHEN** a service has price_cents of 0
- **THEN** the system displays `$0,00` without treating it as a special state

### Requirement: Service Image Upload
The system SHALL allow admins to upload a service image via file picker. The image is stored in Supabase Storage and the public URL is saved in `services.image_url`. The free-text image URL input is replaced by the upload widget. Image display degrades gracefully when absent.

#### Scenario: Service with image shows thumbnail preview in admin panel
- **WHEN** a service has a non-null `image_url` and is displayed in the admin panel
- **THEN** an image thumbnail is shown in the form and list

#### Scenario: Service without image shows placeholder
- **WHEN** a service has no image_url (null) or the image fails to load
- **THEN** the system shows a fallback placeholder icon instead of a broken image
