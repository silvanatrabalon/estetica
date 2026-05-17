## ADDED Requirements

### Requirement: Footer displays Instagram icon link
The system SHALL render the Instagram contact link in the landing page footer as an SVG icon (no text label). The icon link MUST use the correct Instagram URL. The `<a>` element MUST have `aria-label="Instagram"`. The SVG MUST have `aria-hidden="true"`.

#### Scenario: Instagram icon is visible and linked
- **WHEN** a visitor views the landing page footer
- **THEN** the Instagram SVG icon is visible and clicking/tapping it opens the Instagram profile URL

---

### Requirement: Footer displays WhatsApp icon link
The system SHALL render a WhatsApp icon-only link in the footer. The link MUST show only the WhatsApp SVG logo with no visible text label. The `<a>` element MUST have `aria-label="WhatsApp"`. The link MUST point to `https://w.app/bfs0ip`. The URL MUST be fixed and MUST NOT use the `wa.me` constructor.

#### Scenario: WhatsApp icon is visible and linked
- **WHEN** a visitor views the landing page footer
- **THEN** the WhatsApp SVG icon is visible with no text label, and clicking/tapping it opens `https://w.app/bfs0ip`

---

### Requirement: Footer copyright credits Software Queen
The system SHALL render the copyright line as `© 2026 Software Queen` where "Software Queen" is an anchor element linking to `mailto:silvana.trabalon@gmail.com`.

#### Scenario: Copyright line shows linked credit
- **WHEN** a visitor views the landing page footer
- **THEN** the text `© 2026 Software Queen` is visible and "Software Queen" is a clickable mailto link to `silvana.trabalon@gmail.com`
