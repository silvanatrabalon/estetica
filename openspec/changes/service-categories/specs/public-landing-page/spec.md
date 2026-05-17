## MODIFIED Requirements

### Requirement: Landing page displays services catalog section
The system SHALL render a **Servicios** section on `LandingPage` that lists all active services grouped by category. Each category name SHALL appear as a subheading. Services with no category SHALL appear after categorized groups. Empty categories (no active services) SHALL NOT be rendered. Each service card MUST display the service name, price in ARS, and image (if available). The section MUST be visible to unauthenticated visitors.

#### Scenario: Services section renders services grouped by category
- **WHEN** the landing page loads and services with categories exist
- **THEN** each category appears as a subheading with its services listed as cards beneath it

#### Scenario: Uncategorized services are shown last
- **WHEN** some services have no assigned category
- **THEN** those services appear after all categorized groups with no subheading or a neutral label

#### Scenario: Empty category is not rendered
- **WHEN** a category exists but none of its services are active
- **THEN** that category subheading does NOT appear on the landing page

#### Scenario: Services section shows empty state when no services exist
- **WHEN** `list_services()` returns an empty array
- **THEN** a Spanish empty-state message is shown in the services section

#### Scenario: Service with no image shows placeholder
- **WHEN** a service has a null `image_url`
- **THEN** a placeholder graphic is shown instead of a photo
