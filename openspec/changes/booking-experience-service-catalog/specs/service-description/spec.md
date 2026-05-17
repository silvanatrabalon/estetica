## ADDED Requirements

### Requirement: Service Description Field
The system SHALL support an optional text description per service stored as a nullable `description text` column on the `services` table. The description is readable by all authenticated users and writable only by admins through the existing admin RPC functions.

#### Scenario: Admin creates a service with a description
- **WHEN** an admin submits the service create form with a non-empty description
- **THEN** the system persists the description via `admin_create_service()` and the new service record has `description` set

#### Scenario: Admin creates a service without a description
- **WHEN** an admin submits the service create form with an empty or absent description field
- **THEN** the system accepts the submission and the service record has `description = null`

#### Scenario: Admin updates a service description
- **WHEN** an admin modifies the description field of an existing service and saves
- **THEN** the system updates the record via `admin_update_service()` and the change is reflected

#### Scenario: Admin clears a service description
- **WHEN** an admin empties the description field of a service that previously had one and saves
- **THEN** the system sets `description = null` and the change is reflected

#### Scenario: Authenticated user can read service descriptions
- **WHEN** any authenticated user queries the `services` table
- **THEN** the `description` column is included in the result set and accessible

#### Scenario: Service list RPC returns description
- **WHEN** an admin calls `admin_list_services()`
- **THEN** each row in the result includes the `description` field
