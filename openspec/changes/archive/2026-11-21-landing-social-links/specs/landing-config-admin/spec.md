## MODIFIED Requirements

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

