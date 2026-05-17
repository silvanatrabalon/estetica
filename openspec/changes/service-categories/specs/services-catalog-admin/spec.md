## MODIFIED Requirements

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
