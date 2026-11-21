## ADDED Requirements

### Requirement: Admin can view and edit landing page configuration
The system SHALL provide an `LandingConfigPage` React component at `/admin/settings/landing`, accessible only to users with the `admin` role (enforced by `RoleGuard`). The page MUST allow the admin to edit: `hero_title`, `hero_subtitle`, `about_text`, `primary_color`, `secondary_color`, `font_family`, and the `show_hours` toggle. Social networks MUST be edited in the separate "Redes sociales" section of the same page, which has its own save button. All labels and copy MUST be in Spanish. Changes to the landing configuration MUST be saved via `admin_upsert_landing_config()` RPC.

#### Scenario: Admin navigates to landing config panel
- **WHEN** an admin navigates to `/admin/settings/landing`
- **THEN** the `LandingConfigPage` renders with a form pre-populated from `admin_get_landing_config()` and a "Redes sociales" section

#### Scenario: Instagram is no longer in the landing form
- **WHEN** an admin views the landing configuration form
- **THEN** there is no "URL de Instagram" field; Instagram is configured in "Redes sociales"

#### Scenario: Admin saves landing configuration
- **WHEN** the admin edits any field and submits the form
- **THEN** `admin_upsert_landing_config()` is called with all current field values and a Spanish success message is shown

#### Scenario: Admin toggles show_hours off
- **WHEN** the admin sets the Horarios toggle to off and saves
- **THEN** `admin_upsert_landing_config()` is called with `show_hours = false`

#### Scenario: Non-admin is denied access
- **WHEN** a user with role other than `admin` accesses `/admin/settings/landing`
- **THEN** they are redirected to `/unauthorized`

#### Scenario: Form shows validation error for empty hero_title
- **WHEN** the admin submits the form with an empty `hero_title`
- **THEN** a Spanish validation error is shown and the RPC is not called

### Requirement: Admin can manage carousel images
The system SHALL allow the admin to upload, reorder, and delete carousel images from the `LandingConfigPage`. Images MUST be uploaded to the Supabase Storage `media` bucket under the `carousel/` path prefix via `uploadMediaFile()`. After upload, `admin_add_carousel_image()` MUST be called to persist the path and metadata. Reordering MUST call `admin_reorder_carousel_images()`. Deletion MUST call `admin_remove_carousel_image()` and then delete the file from Storage via `deleteMediaFile()`.

#### Scenario: Admin uploads a new carousel image
- **WHEN** the admin selects an image file and confirms upload
- **THEN** the file is uploaded to `media/carousel/<uuid>.<ext>`, `admin_add_carousel_image()` is called with the resulting path, and the new image appears in the carousel image list

#### Scenario: Admin reorders carousel images
- **WHEN** the admin drags carousel images into a new order and saves
- **THEN** `admin_reorder_carousel_images()` is called with the new ordered list of image IDs

#### Scenario: Admin deletes a carousel image
- **WHEN** the admin clicks delete on a carousel image and confirms
- **THEN** `admin_remove_carousel_image()` is called and the file is removed from Storage

#### Scenario: Admin sees upload error when file type is invalid
- **WHEN** the admin attempts to upload a non-image file (e.g., `.pdf`)
- **THEN** a Spanish error message is shown and no upload is attempted

---

### Requirement: Admin navigation includes landing config entry
The system SHALL add an **"Apariencia"** nav entry to the admin navigation section pointing to `/admin/appearance`. The entry MUST appear in `navigationByRole.admin` and be protected by `RoleGuard` in `routePolicies`. The landing configuration form MUST be rendered in the "Página pública" tab of that page. The former path `/admin/settings/landing` MUST redirect to `/admin/appearance`.

#### Scenario: Admin sees Apariencia in navigation
- **WHEN** an admin is authenticated and views the navigation
- **THEN** an "Apariencia" link is visible pointing to `/admin/appearance`

#### Scenario: Route is registered in routePolicies
- **WHEN** the router resolves `/admin/appearance`
- **THEN** the route matches the `admin` role guard and renders `AppearancePage`, whose "Página pública" tab hosts the landing configuration form

#### Scenario: Old route redirects
- **WHEN** the router resolves `/admin/settings/landing`
- **THEN** it redirects to `/admin/appearance`
