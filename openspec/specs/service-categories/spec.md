## ADDED Requirements

### Requirement: Admin can create and manage service categories
The system SHALL provide admin RPCs and a UI for full CRUD of service categories. Each category SHALL have a `name` and a `display_order`. An admin MUST be able to create, rename, reorder, and delete categories. Deleting a category that has assigned services MUST be rejected with a Spanish error message. All labels and copy MUST be in Spanish.

#### Scenario: Admin creates a category
- **WHEN** the admin submits a new category name
- **THEN** `admin_create_category()` is called, the category is persisted, and it appears in the category list

#### Scenario: Admin renames a category
- **WHEN** the admin edits an existing category name and saves
- **THEN** `admin_update_category()` is called and the updated name is reflected everywhere the category is shown

#### Scenario: Admin deletes a category with no assigned services
- **WHEN** the admin deletes a category that has no services
- **THEN** `admin_delete_category()` removes the row and the category disappears from the list

#### Scenario: Admin cannot delete a category with assigned services
- **WHEN** the admin attempts to delete a category that still has services assigned
- **THEN** a Spanish error message is shown and the category is NOT deleted

---

### Requirement: Services can be assigned a category
The system SHALL allow an admin to assign one optional category to each service via a "Categoría" dropdown in the create/edit service form. The `category_id` FK on `services` is nullable — a service with no category is considered uncategorized. `admin_create_service()` and `admin_update_service()` MUST accept and persist `p_category_id`.

#### Scenario: Admin assigns a category when creating a service
- **WHEN** the admin selects a category from the dropdown and saves a new service
- **THEN** the service is created with the selected `category_id`

#### Scenario: Admin changes a service's category
- **WHEN** the admin selects a different category for an existing service and saves
- **THEN** `admin_update_service()` is called with the new `category_id`

#### Scenario: Service with no category is valid
- **WHEN** the admin saves a service without selecting a category
- **THEN** the service is saved with `category_id = null` and appears in the uncategorized group

---

### Requirement: Public landing page groups services by category
The system SHALL render the **Servicios** section on the public landing page with services grouped under their category name as a section subheading. Services with `category_id = null` MUST appear after all categorized groups under a neutral heading or ungrouped. Empty categories (no active services) MUST NOT be rendered.

#### Scenario: Landing page shows categorized services
- **WHEN** the landing page loads and services with categories exist
- **THEN** each category name appears as a subheading with its services listed beneath it

#### Scenario: Uncategorized services appear last
- **WHEN** some services have no assigned category
- **THEN** those services appear after all categorized groups

#### Scenario: Empty category is not rendered
- **WHEN** a category exists but has no active services
- **THEN** that category heading is NOT rendered on the landing page

---

### Requirement: Booking wizard Step 1 shows category filter tabs
The system SHALL render category filter tabs/chips above the service grid in booking wizard Step 1. A "Todos" tab MUST always appear first. One tab per category that has at least one active service MUST follow. Selecting a tab filters the service grid to that category. Filtering is client-side. The UI MUST be responsive and visually improved over the current plain list.

#### Scenario: "Todos" tab shows all active services
- **WHEN** the customer selects the "Todos" tab
- **THEN** all active services are shown in the grid regardless of category

#### Scenario: Category tab filters the grid
- **WHEN** the customer selects a category tab
- **THEN** only services belonging to that category are displayed in the grid

#### Scenario: No filter tabs when only one category exists
- **WHEN** all active services belong to a single category
- **THEN** the filter tabs are still rendered (allows future expansion); "Todos" is pre-selected

#### Scenario: Grid renders with improved visual quality
- **WHEN** the customer views Step 1
- **THEN** service cards have adequate spacing, clear hierarchy (name prominent, price secondary), and the layout is usable on mobile (single column) and desktop (2–3 columns)
