## ADDED Requirements

### Requirement: Service Detail Panel
The system SHALL provide a service detail panel — rendered as a bottom drawer on mobile and a side panel on desktop — that shows the full service description and a "Seleccionar este servicio" CTA. The panel is triggered by tapping a card in the booking wizard Step 1 when the card has a description.

#### Scenario: Tapping a card with a description opens the detail panel
- **WHEN** a customer taps/clicks a service card that has a non-null, non-empty `description`
- **THEN** the detail panel opens, displaying the service image (or placeholder), name, price, duration, and full description

#### Scenario: Tapping a card without a description selects it directly
- **WHEN** a customer taps/clicks a service card with a null or empty `description`
- **THEN** the card is selected immediately without opening the detail panel

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
