## MODIFIED Requirements

### Requirement: Admin chooses which social networks to show
The system SHALL let an admin configure Instagram, WhatsApp, Facebook, TikTok, YouTube, X and Sitio web in the "Redes sociales" section of the "Página pública" tab of Apariencia. Each network MUST have a value and a "Mostrar" check. A network is shown to visitors only when its check is on and it has a value.

#### Scenario: Admin saves links and visibility
- **WHEN** an admin fills networks, sets "Mostrar" on some and off on others, and saves
- **THEN** all filled networks are stored with their `enabled` flag and empty ones are removed

#### Scenario: Admin hides a network without losing its link
- **WHEN** an admin unticks "Mostrar" on a network that has a value and saves
- **THEN** the value is kept and the network no longer appears on the public page

#### Scenario: Admin clears a network
- **WHEN** an admin empties a network's field and saves
- **THEN** that network's row is deleted
