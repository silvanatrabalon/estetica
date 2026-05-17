## ADDED Requirements

### Requirement: Public landing page renders without authentication
The system SHALL provide a `LandingPage` React component mounted at the `/` route that is fully accessible to unauthenticated visitors (anon role). The page MUST NOT require a Supabase session to render. All user-facing copy MUST be in Spanish.

#### Scenario: Unauthenticated visitor loads the landing page
- **WHEN** an unauthenticated visitor navigates to `/`
- **THEN** the `LandingPage` renders with all public sections visible and no login wall

#### Scenario: Customer user loads the landing page
- **WHEN** an authenticated user with role `customer` navigates to `/`
- **THEN** the `LandingPage` renders with a booking CTA linking to `/booking`

#### Scenario: Admin user is redirected away from landing
- **WHEN** an authenticated user with role `admin` navigates to `/`
- **THEN** they are redirected to `/admin/dashboard` (their `roleHome`)

#### Scenario: Staff user is redirected away from landing
- **WHEN** an authenticated user with role `staff` navigates to `/`
- **THEN** they are redirected to their `roleHome`

---

### Requirement: Landing page displays hero section with carousel
The system SHALL render a full-width hero section as the first visible element of `LandingPage`. The hero MUST include: a headline (`hero_title`), a subtitle (`hero_subtitle`), a full-width image carousel auto-cycling through `landing_carousel_images` at 4-second intervals, and a primary CTA button. The CTA MUST navigate unauthenticated visitors to `/signin?redirect=/booking` and authenticated customers directly to `/booking`.

#### Scenario: Hero renders with configured title and subtitle
- **WHEN** `get_landing_config()` returns non-null `hero_title` and `hero_subtitle`
- **THEN** the hero section displays those values as the headline and subtitle

#### Scenario: Hero renders with defaults when config is null
- **WHEN** `get_landing_config()` returns null values for `hero_title` and `hero_subtitle`
- **THEN** the hero section displays hardcoded Spanish placeholder copy

#### Scenario: Carousel auto-cycles through images
- **WHEN** `landing_carousel_images` contains at least 2 images
- **THEN** the carousel advances to the next image every 4 seconds automatically

#### Scenario: Carousel shows single image without cycling controls
- **WHEN** `landing_carousel_images` contains exactly 1 image
- **THEN** that image is displayed statically with no navigation arrows or dot indicators

#### Scenario: Unauthenticated visitor clicks CTA
- **WHEN** an unauthenticated visitor clicks the primary CTA button
- **THEN** they are navigated to `/signin?redirect=/booking`

#### Scenario: Authenticated customer clicks CTA
- **WHEN** an authenticated customer clicks the primary CTA button
- **THEN** they are navigated to `/booking`

---

### Requirement: Landing page displays services catalog section
The system SHALL render a **Servicios** section on `LandingPage` that lists all active services fetched via the existing `list_services()` RPC (granted to `anon` role). Each service card MUST display the service name, price in ARS, and image (if available). The section MUST be visible to unauthenticated visitors.

#### Scenario: Services section renders all active services
- **WHEN** the landing page loads and `list_services()` returns services
- **THEN** each service is displayed as a card with name, price in ARS, and image if available

#### Scenario: Services section shows empty state when no services exist
- **WHEN** `list_services()` returns an empty array
- **THEN** a Spanish empty-state message is shown in the services section

#### Scenario: Service with no image shows placeholder
- **WHEN** a service has a null `image_url`
- **THEN** a placeholder graphic is shown instead of a photo

---

### Requirement: Landing page displays about, hours, and contact sections
The system SHALL render an **Sobre Nosotros** section (hidden when `about_text` is null/empty), a **Horarios** section (hidden when `show_hours` is `false`), and a **Contacto** footer with `instagram_url` and `whatsapp_number` from `landing_config`. All sections MUST be readable without authentication.

#### Scenario: About section displays configured about_text
- **WHEN** `landing_config.about_text` is non-null and non-empty
- **THEN** the Sobre Nosotros section is rendered with that text

#### Scenario: About section is hidden when about_text is empty
- **WHEN** `landing_config.about_text` is null or empty string
- **THEN** the Sobre Nosotros section is NOT rendered

#### Scenario: Hours section displays when show_hours is true
- **WHEN** `landing_config.show_hours` is `true` and `business_hours` rows exist
- **THEN** the Horarios section displays the weekly schedule

#### Scenario: Hours section is hidden when show_hours is false
- **WHEN** `landing_config.show_hours` is `false`
- **THEN** the Horarios section is NOT rendered

#### Scenario: Footer shows social links when configured
- **WHEN** `landing_config.instagram_url` or `landing_config.whatsapp_number` is non-null
- **THEN** the footer displays the corresponding social/contact links

---

### Requirement: Landing page applies dynamic CSS theming from config
The system SHALL apply `primary_color`, `secondary_color`, and `font_family` from `landing_config` as CSS custom properties on the `LandingPage` root element. Default values MUST be applied when the config fields are null: `#f9a8d4` for primary color, `#fbcfe8` for secondary color, and `Inter` for font family. Google Fonts MUST be dynamically injected for the configured `font_family` via a `<link>` element added to `<head>` inside a `useEffect`.

#### Scenario: Page applies configured colors
- **WHEN** `landing_config` returns specific `primary_color` and `secondary_color` hex values
- **THEN** those values are set as `--lp-primary` and `--lp-secondary` CSS custom properties on the page root

#### Scenario: Page applies default colors when config is null
- **WHEN** `landing_config` color fields are null
- **THEN** `--lp-primary` defaults to `#f9a8d4` and `--lp-secondary` to `#fbcfe8`

#### Scenario: Google Font is injected for configured font_family
- **WHEN** `landing_config.font_family` is set to a valid Google Font name
- **THEN** a `<link>` referencing the Google Fonts API for that font is appended to `<head>`
