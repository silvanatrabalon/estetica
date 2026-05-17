## ADDED Requirements

### Requirement: Service Selection Card Grid
The system SHALL replace the plain list in BookingPage Step 1 (service selection) with a responsive grid of service cards. The grid SHALL use 2 columns on mobile and 3 columns on desktop (≥ 768 px). Each card SHALL display the service image, name, price in ARS, and duration in minutes.

#### Scenario: Cards render in a 2-column grid on mobile
- **WHEN** a customer views BookingPage Step 1 on a viewport narrower than 768 px
- **THEN** service cards are arranged in a 2-column grid

#### Scenario: Cards render in a 3-column grid on desktop
- **WHEN** a customer views BookingPage Step 1 on a viewport of 768 px or wider
- **THEN** service cards are arranged in a 3-column grid

#### Scenario: Card displays service image when available
- **WHEN** a service has a non-null `image_url`
- **THEN** the card shows the image in the card's image area

#### Scenario: Card shows placeholder when image is absent
- **WHEN** a service has a null `image_url` or the image fails to load
- **THEN** the card's image area shows a colored placeholder using `primary_color` from `landing_config` (with pastel fallback if unavailable)

#### Scenario: Card displays name, price, and duration
- **WHEN** a service card is rendered
- **THEN** the card shows the service name, price formatted in ARS, and duration in minutes

#### Scenario: Card has a hover state
- **WHEN** a customer hovers over a service card with a pointer device
- **THEN** the card displays a visual hover affordance (e.g., border highlight, shadow lift)

#### Scenario: Card has a selected state
- **WHEN** a customer clicks a service card
- **THEN** the card is marked as selected (e.g., colored border, checkmark) and the selected service is stored in booking state

#### Scenario: Only one card can be selected at a time
- **WHEN** a customer selects a service card while another card is already selected
- **THEN** the previous card deselects and the new card becomes selected

#### Scenario: Loading skeleton is shown while services are fetched
- **WHEN** BookingPage Step 1 is mounting and `useActiveServices()` has not resolved
- **THEN** the system renders skeleton placeholder cards in the same grid layout

#### Scenario: Empty state is shown when no services are available
- **WHEN** `useActiveServices()` resolves with an empty array
- **THEN** the system renders a Spanish empty state message instead of the grid
