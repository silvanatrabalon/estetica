## ADDED Requirements

### Requirement: Footer displays Instagram icon link
The system SHALL render the Instagram link in the landing footer as an SVG icon only when Instagram is enabled in the social links configuration and has a valid value. The `<a>` element MUST have `aria-label="Instagram"` and the SVG MUST have `aria-hidden="true"`.

#### Scenario: Instagram icon is visible and linked
- **WHEN** Instagram is enabled with a valid URL and a visitor views the footer
- **THEN** the Instagram icon is visible and opens that URL

#### Scenario: Instagram hidden
- **WHEN** Instagram is not enabled or has no value
- **THEN** no Instagram icon is rendered

---

### Requirement: Footer displays WhatsApp icon link
The system SHALL render the WhatsApp link in the footer as an SVG icon only when WhatsApp is enabled and has a valid number. The link MUST point to `https://wa.me/<digits>` built from the configured number. The `<a>` element MUST have `aria-label="WhatsApp"`. The previously fixed `https://w.app/bfs0ip` link MUST NOT be used.

#### Scenario: WhatsApp icon links to the configured number
- **WHEN** WhatsApp is enabled with number `5491112345678`
- **THEN** the icon links to `https://wa.me/5491112345678`

#### Scenario: WhatsApp hidden until configured
- **WHEN** no WhatsApp number is saved
- **THEN** no WhatsApp icon is rendered

---

### Requirement: Footer copyright credits Software Queen
The system SHALL render the copyright line as `© 2026 Software Queen` where "Software Queen" is an anchor element linking to `mailto:silvana.trabalon@gmail.com`.

#### Scenario: Copyright line shows linked credit
- **WHEN** a visitor views the landing page footer
- **THEN** the text `© 2026 Software Queen` is visible and "Software Queen" is a clickable mailto link to `silvana.trabalon@gmail.com`
