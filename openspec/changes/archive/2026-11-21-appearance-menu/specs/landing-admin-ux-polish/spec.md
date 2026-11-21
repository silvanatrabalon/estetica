## MODIFIED Requirements

### Requirement: Admin landing config panel uses plain Spanish labels
The system SHALL display the admin landing config panel with plain Spanish labels throughout. The navigation entry is "Apariencia", the tab hosting the panel is "Página pública", and all section headers MUST NOT contain the words "Landing" or "Hero". The form section previously labelled "Sección principal (Hero)" MUST be relabelled "Sección principal".

#### Scenario: Admin sees Apariencia in navigation
- **WHEN** an admin views the admin sidebar navigation
- **THEN** the entry pointing to `/admin/appearance` displays the label "Apariencia"

#### Scenario: Panel labels do not contain "Landing" or "Hero"
- **WHEN** an admin opens the "Página pública" tab of Apariencia
- **THEN** the tab and section headers contain no occurrence of "Landing" or "Hero"

#### Scenario: Hero section label is relabelled
- **WHEN** the admin views the landing config form
- **THEN** the section previously labelled "Sección principal (Hero)" now renders as "Sección principal"
