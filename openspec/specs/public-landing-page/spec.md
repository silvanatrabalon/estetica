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
The system SHALL render a **Servicios** section on `LandingPage` that lists all active services grouped by category. Each category name SHALL appear as a subheading. Services with no category SHALL appear after categorized groups. Empty categories (no active services) SHALL NOT be rendered. Each service card MUST display the service name, price in ARS, and image (if available). The section MUST be visible to unauthenticated visitors.

#### Scenario: Services section renders services grouped by category
- **WHEN** the landing page loads and services with categories exist
- **THEN** each category appears as a subheading with its services listed as cards beneath it

#### Scenario: Uncategorized services are shown last
- **WHEN** some services have no assigned category
- **THEN** those services appear after all categorized groups with no subheading or a neutral label

#### Scenario: Empty category is not rendered
- **WHEN** a category exists but none of its services are active
- **THEN** that category subheading does NOT appear on the landing page

#### Scenario: Services section shows empty state when no services exist
- **WHEN** `list_services()` returns an empty array
- **THEN** a Spanish empty-state message is shown in the services section

#### Scenario: Service with no image shows placeholder
- **WHEN** a service has a null `image_url`
- **THEN** a placeholder graphic is shown instead of a photo

---

### Requirement: Landing page displays about, hours, and contact sections
The system SHALL render an **Sobre Nosotros** section (hidden when `about_text` is null/empty), a **Horarios** section (hidden when `show_hours` is `false`), and a **Contacto** footer. All sections MUST be readable without authentication.

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

---

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

### Requirement: El carrusel de la portada no tiene flechas
El carrusel de imágenes de la portada SHALL avanzar solo y mostrar los puntos indicadores; MUST NOT mostrar flechas anterior/siguiente.

### Requirement: Servicios en un carrusel que gira
La sección de servicios SHALL ser una fila horizontal que se mueve sola y en círculo (sin cortes), se pausa al pasar el mouse o enfocar, y queda quieta con scroll manual si la persona pidió menos movimiento. No hay filtro por categoría. Cada tarjeta lleva a `/booking?servicio=<id>` (los visitantes pasan antes por `/signin?redirect=…` y vuelven a esa misma reserva). Los servicios en promo de las promos marcadas para el sitio muestran la insignia PROMO, el precio original tachado y el precio con promo (si hay varias, la de mayor descuento). La copia repetida de la fila queda oculta a lectores de pantalla y teclado.

### Requirement: Promos y cupones llevan a su reserva
En "Promociones", cada promo SHALL llevar a `/booking?promo=<id>` y cada cupón a `/booking?cupon=<código>[&categoria=<nombre>]`. La reserva abre directo en la fecha si la promo tiene un solo servicio, o filtrada a los servicios de esa promo; un cupón se aplica solo al llegar a la revisión (si el servicio tiene promo o el cupón no es válido, se avisa y se cobra sin él). Un `?servicio=` desconocido o una promo vencida dejan la lista como está.

