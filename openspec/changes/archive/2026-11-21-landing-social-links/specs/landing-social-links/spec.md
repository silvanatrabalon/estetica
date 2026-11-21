## ADDED Requirements

### Requirement: Admin chooses which social networks to show
The system SHALL let an admin configure Instagram, WhatsApp, Facebook, TikTok, YouTube, X and Sitio web in the "Redes sociales" section of Página pública. Each network MUST have a value and a "Mostrar" check. A network is shown to visitors only when its check is on and it has a value.

#### Scenario: Admin saves links and visibility
- **WHEN** an admin fills networks, sets "Mostrar" on some and off on others, and saves
- **THEN** all filled networks are stored with their `enabled` flag and empty ones are removed

#### Scenario: Admin hides a network without losing its link
- **WHEN** an admin unticks "Mostrar" on a network that has a value and saves
- **THEN** the value is kept and the network no longer appears on the public page

#### Scenario: Admin clears a network
- **WHEN** an admin empties a network's field and saves
- **THEN** that network's row is deleted

### Requirement: Social link values are validated
The system MUST validate every value before saving. URLs MUST use http or https and have a host; a URL typed without a scheme MUST get `https://`. WhatsApp MUST be a phone number of 8 to 15 digits; non-digit characters are removed. Invalid values MUST show a Spanish error and MUST NOT be saved.

#### Scenario: URL without scheme is normalized
- **WHEN** an admin saves `instagram.com/sil`
- **THEN** `https://instagram.com/sil` is stored

#### Scenario: Dangerous URL is rejected
- **WHEN** an admin saves `javascript:alert(1)` in any URL network
- **THEN** a Spanish error is shown and nothing is written to the database

#### Scenario: WhatsApp number boundaries
- **WHEN** an admin saves a WhatsApp value with 7 digits, or 16 digits, or only letters
- **THEN** a Spanish error is shown and nothing is saved
- **AND** values with 8 to 15 digits are accepted

### Requirement: Social links are publicly readable but admin-writable
The `social_links` table MUST allow anonymous and authenticated users to read only rows with `enabled = true`, admins to read all rows, and only admins to insert, update or delete.

#### Scenario: Visitor reads enabled links
- **WHEN** an anonymous visitor queries `social_links`
- **THEN** only enabled rows are returned

#### Scenario: Visitor cannot write
- **WHEN** an anonymous client tries to insert into `social_links`
- **THEN** the request is rejected

### Requirement: Footer renders the enabled networks
The landing footer MUST render one icon link per enabled network with a valid value, in the fixed order Instagram, WhatsApp, Facebook, TikTok, YouTube, X, Sitio web. Each link MUST have `aria-label` equal to the network name, open in a new tab with `rel="noopener noreferrer"`, and WhatsApp MUST link to `https://wa.me/<digits>`.

#### Scenario: Only enabled networks appear
- **WHEN** Instagram and WhatsApp are enabled and Facebook is hidden
- **THEN** the footer shows Instagram and WhatsApp icons and no Facebook icon

#### Scenario: No links configured
- **WHEN** no network is enabled
- **THEN** the footer renders no social icons

#### Scenario: Unsafe stored value is not rendered
- **WHEN** a stored value fails validation
- **THEN** its link is not rendered
