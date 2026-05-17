## MODIFIED Requirements

### Requirement: Landing page footer shows social and contact links
The system SHALL render a footer on `LandingPage` with social and contact links. The footer MUST include an Instagram icon link (SVG, `aria-label="Instagram"`), a WhatsApp icon-only link (SVG, `aria-label="WhatsApp"`) with no text label linking to `https://w.app/bfs0ip`, and a copyright line `© 2026 Software Queen` where "Software Queen" is a `mailto:silvana.trabalon@gmail.com` link.

#### Scenario: Instagram icon link is present and accessible
- **WHEN** a visitor loads the landing page
- **THEN** an Instagram SVG icon is shown in the footer with `aria-label="Instagram"` on the link element

#### Scenario: WhatsApp icon link is present and correct
- **WHEN** a visitor loads the landing page
- **THEN** a WhatsApp icon-only link is shown in the footer with `aria-label="WhatsApp"` linking to `https://w.app/bfs0ip` and no visible text label

#### Scenario: Copyright shows Software Queen credit with mailto
- **WHEN** a visitor loads the landing page
- **THEN** the footer shows `© 2026 Software Queen` and "Software Queen" links to `mailto:silvana.trabalon@gmail.com`
