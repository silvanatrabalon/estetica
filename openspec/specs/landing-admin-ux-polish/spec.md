## ADDED Requirements

### Requirement: Admin landing config panel uses plain Spanish labels
The system SHALL display the admin landing config panel with plain Spanish labels throughout. The navigation entry is "Apariencia", the tab hosting the panel is "Página pública", and all section headers MUST NOT contain the words "Landing" or "Hero". The form section previously labelled "Sección principal (Hero)" MUST be relabelled "Sección principal".

#### Scenario: Admin sees Apariencia in navigation
- **WHEN** an admin views the admin sidebar navigation
- **THEN** the entry pointing to `/admin/appearance` displays the label "Apariencia"

#### Scenario: Panel labels do not contain "Landing" or "Hero"
- **WHEN** an admin opens the "Página pública" tab of Apariencia
- **THEN** the tab and section headers contain no occurrence of "Landing" or "Hero"

#### Scenario: Hero section label is relabelled
- **WHEN** the admin views the landing config form
- **THEN** the section previously labelled "Sección principal (Hero)" now renders as "Sección principal"

---

### Requirement: Carousel section appears above the save button
The system SHALL render the **Carrusel de imágenes** section in the landing config form above the "Guardar cambios" primary action button. No form section that edits configuration fields SHALL appear below the save button.

#### Scenario: Carousel section is above the save button
- **WHEN** the admin scrolls through the landing config form
- **THEN** the Carrusel de imágenes section is visible before reaching the "Guardar cambios" button

---

### Requirement: Typography section shows live font preview and expanded options
The system SHALL provide a **Tipografía** section in the landing config form that:
- Offers at least 10 curated Google Fonts options covering sans-serif, serif, and display categories.
- Renders a live preview sentence ("El rápido zorro marrón salta sobre el perro perezoso") in the currently selected font immediately below the selector.
- Loads all selectable fonts on page mount so the preview renders without a save-and-reload cycle.

#### Scenario: Typography section shows at least 10 font options
- **WHEN** the admin opens the font family dropdown
- **THEN** at least 10 font family options are listed

#### Scenario: Preview updates when font is changed
- **WHEN** the admin selects a different font family
- **THEN** the preview sentence renders immediately in the newly selected font without saving

#### Scenario: All fonts are available for preview on page load
- **WHEN** the admin navigates to `/admin/settings/landing`
- **THEN** all selectable font families are loaded and the preview renders in the saved font without requiring a page reload
