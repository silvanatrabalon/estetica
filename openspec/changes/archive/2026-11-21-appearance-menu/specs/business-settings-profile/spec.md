## MODIFIED Requirements

### Requirement: Canonical Business Identity And Branding
The system MUST persist the single business identity in the database as canonical business configuration. Negocio (General tab) MUST manage only the business name and time zone. The logo and the booking title/subtitle MUST be managed in Apariencia, and the colors in the Página pública design settings. The brand color previously editable in Negocio is no longer editable or used.

#### Scenario: Admin updates business name and time zone
- **WHEN** an authenticated admin saves a valid business name and time zone in Negocio
- **THEN** the system persists them as canonical business settings without changing the logo or booking texts

#### Scenario: Branding is not edited in Negocio
- **WHEN** an admin opens Negocio
- **THEN** there are no logo, color or booking text fields; they are in Apariencia
