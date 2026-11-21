## ADDED Requirements

### Requirement: Apariencia menu groups everything the customer sees
The system SHALL provide an admin-only menu entry **Apariencia** at `/admin/appearance` with two tabs: "Marca y reservas" and "Página pública". The "Página pública" tab MUST contain the landing page content form followed by the "Redes sociales" section. The menu MUST NOT contain a separate "Página pública" entry. The old path `/admin/settings/landing` MUST redirect to `/admin/appearance`. Panels MUST stay mounted when switching tabs so unsaved edits are not lost.

#### Scenario: Admin sees Apariencia in the menu
- **WHEN** an admin views the navigation
- **THEN** an "Apariencia" entry pointing to `/admin/appearance` is shown and no "Página pública" entry exists

#### Scenario: Non-admins cannot access Apariencia
- **WHEN** a staff member, a customer or an unauthenticated visitor requests `/admin/appearance`
- **THEN** access is denied and the entry is not in their menu

#### Scenario: Old URL still works
- **WHEN** someone opens `/admin/settings/landing`
- **THEN** they are redirected to `/admin/appearance`

#### Scenario: Switching tabs keeps unsaved edits
- **WHEN** the admin edits a field, switches to another tab and comes back
- **THEN** the edit is still there

### Requirement: Brand form manages logo and booking texts
The "Marca y reservas" tab MUST let the admin upload a logo (JPG, PNG, WEBP or GIF, up to 2 MB) or paste its URL, remove it, and set an optional booking title (max 80 characters) and subtitle (max 160 characters). Saving MUST write only the logo and the two texts, and never business rules. Invalid files or over-long texts MUST be rejected with a Spanish message before anything is saved.

#### Scenario: Admin uploads and saves a logo
- **WHEN** the admin picks a valid image and presses "Guardar marca"
- **THEN** the image is stored and its public URL is saved as the logo

#### Scenario: Invalid logo file
- **WHEN** the admin picks a PDF or an image over 2 MB
- **THEN** a Spanish error is shown and nothing is uploaded

#### Scenario: Failed upload keeps the previous logo
- **WHEN** the upload fails
- **THEN** an error is shown and the previous logo is kept

#### Scenario: Over-long booking text
- **WHEN** the title exceeds 80 or the subtitle exceeds 160 characters and the admin saves
- **THEN** a Spanish error is shown and nothing is saved

#### Scenario: Removing the logo
- **WHEN** the admin presses "Quitar logo" and saves
- **THEN** the logo is stored as empty (null)

### Requirement: Logo appears in the top bar
The top bar MUST show the configured logo next to the business name for every role. If there is no logo, loading fails, or the image fails to load, nothing MUST be shown and the bar MUST still render.

#### Scenario: Logo shown
- **WHEN** a logo is configured
- **THEN** it is displayed in the top bar

#### Scenario: No logo or broken image
- **WHEN** no logo is configured, the lookup fails, or the image fails to load
- **THEN** no logo is shown and the rest of the bar is unaffected

### Requirement: Booking screen uses the configured texts
The customer booking screen MUST show the configured title and subtitle. Empty or blank values MUST fall back to "Reservar turno" and "Elegí el servicio que querés reservar.". If business settings fail to load, the defaults MUST be used.

#### Scenario: Custom texts
- **WHEN** a title and a subtitle are configured
- **THEN** the booking screen shows them instead of the defaults

#### Scenario: Blank or missing texts
- **WHEN** the texts are empty, blank or the settings fail to load
- **THEN** the booking screen shows the defaults

### Requirement: Saving business rules does not overwrite appearance
Saving the Negocio form MUST NOT write the logo, brand color or booking text columns. Those are written only when explicitly provided by a caller.

#### Scenario: Negocio save leaves branding untouched
- **WHEN** an admin saves the General tab of Negocio
- **THEN** the save request contains no logo, color or booking text fields
