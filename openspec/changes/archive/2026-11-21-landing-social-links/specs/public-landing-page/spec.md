## MODIFIED Requirements

### Requirement: Landing page footer shows social and contact links
The system SHALL render a footer on `LandingPage` with the social links configured and enabled by the admin, and a copyright line `© 2026 Software Queen` where "Software Queen" is a `mailto:silvana.trabalon@gmail.com` link. Social icons MUST come from the `social_links` configuration, not from fixed values.

#### Scenario: Footer shows configured networks
- **WHEN** a visitor loads the landing page and some networks are enabled
- **THEN** the footer shows an icon link with `aria-label` for each enabled network

#### Scenario: Footer without configured networks
- **WHEN** a visitor loads the landing page and no network is enabled
- **THEN** the footer shows no social icons but still shows the copyright line

#### Scenario: Copyright shows Software Queen credit with mailto
- **WHEN** a visitor loads the landing page
- **THEN** the footer shows `© 2026 Software Queen` and "Software Queen" links to `mailto:silvana.trabalon@gmail.com`
