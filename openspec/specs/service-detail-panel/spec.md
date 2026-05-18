## ADDED Requirements

### Requirement: Service Detail Panel
The system SHALL provide a service detail panel — rendered as a bottom drawer on mobile and a side panel on desktop — that shows the full service description and a "Seleccionar este servicio" CTA. The panel is triggered by tapping ANY service card in the booking wizard Step 1, regardless of whether the service has a `description`, `image_url`, or both. On desktop, the panel SHALL fill the full viewport height and scroll internally if content overflows.

#### Scenario: Tapping any service card opens the detail panel
- **WHEN** a customer taps/clicks any service card in booking wizard Step 1
- **THEN** the detail panel opens, displaying the service image (or pastel placeholder if `image_url` is null), name, price, duration, and description (or empty description area if null)

#### Scenario: Service without an image uses the pastel placeholder
- **WHEN** the detail panel opens for a service where `image_url` is null
- **THEN** the image slot renders the pastel placeholder (using `primary_color` as background with service initial)

#### Scenario: Desktop panel fills viewport height and scrolls
- **WHEN** the detail panel is open on a viewport of 768 px or wider and the content exceeds the viewport height
- **THEN** the panel fills the full viewport height and its content area scrolls internally without the page scrolling

#### Scenario: "Seleccionar este servicio" CTA selects and closes the panel
- **WHEN** a customer clicks the "Seleccionar este servicio" button in the detail panel
- **THEN** the corresponding service is set as the selected service in booking state and the panel closes

#### Scenario: Detail panel can be dismissed without selecting
- **WHEN** a customer closes the detail panel by tapping the backdrop (mobile) or a close button
- **THEN** the panel closes and the booking state is unchanged

#### Scenario: Detail panel renders as a bottom drawer on mobile
- **WHEN** the detail panel is open on a viewport narrower than 768 px
- **THEN** the panel slides up from the bottom of the screen

#### Scenario: Detail panel renders as a side panel on desktop
- **WHEN** the detail panel is open on a viewport of 768 px or wider
- **THEN** the panel appears alongside the card grid (e.g., as a right-side overlay or fixed panel)

#### Scenario: Detail panel shows truncated description in card and full description in panel
- **WHEN** a service has a description longer than ~80 characters
- **THEN** the card shows a truncated version and the full text is displayed only in the detail panel
