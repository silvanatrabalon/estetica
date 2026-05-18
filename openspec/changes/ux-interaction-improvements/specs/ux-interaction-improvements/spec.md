## ADDED Requirements

### Requirement: Booking wizard has fixed persistent navigation
The booking wizard at `/booking` SHALL render a fixed back button in the top-left corner and a fixed primary CTA ("Siguiente" or "Confirmar reserva") anchored to the bottom-right on desktop and full-width at the bottom on mobile. These elements MUST remain visible while the user scrolls through step content. The scrollable step content MUST have sufficient top and bottom padding to prevent content from being hidden behind the fixed elements. On Step 1, the back button SHALL be hidden (there is no previous step).

#### Scenario: Back button is hidden on Step 1
- **WHEN** the user is on Step 1 of the booking wizard
- **THEN** no back button is rendered

#### Scenario: Back button is visible and fixed on Steps 2–4
- **WHEN** the user is on Steps 2, 3, or 4 of the booking wizard and scrolls down
- **THEN** the back button ("← Volver") remains visible in the top-left of the viewport

#### Scenario: CTA is fixed to bottom-right on desktop
- **WHEN** the user is on any booking wizard step on a desktop viewport and scrolls down
- **THEN** the primary CTA button remains visible in the bottom-right corner

#### Scenario: CTA is fixed full-width at bottom on mobile
- **WHEN** the user is on any booking wizard step on a mobile viewport
- **THEN** the primary CTA button spans the full viewport width and is anchored to the bottom

#### Scenario: CTA label matches step context
- **WHEN** the user is on Steps 1–3
- **THEN** the CTA label reads "Siguiente"
- **WHEN** the user is on Step 4
- **THEN** the CTA label reads "Confirmar reserva"

### Requirement: Admin business settings color principal uses a color picker
The "Color principal" field in `/admin/settings/business` SHALL render as a native `<input type="color">` component. A helper text label SHALL be displayed below the picker reading: "Define el color de acento del sistema de turnos (botones, badges, resaltados — actualmente verde)."

#### Scenario: Color picker renders with current value
- **WHEN** the admin opens `/admin/settings/business`
- **THEN** the color picker is pre-populated with the stored hex value for `primary_color`

#### Scenario: Selecting a color updates the stored value
- **WHEN** the admin selects a new color using the picker and saves
- **THEN** the updated hex value is stored in the database

#### Scenario: Helper text is visible
- **WHEN** the color picker is rendered
- **THEN** the helper label is visible below the input

### Requirement: Admin business settings booking min-notice uses segmented duration input
The `booking_min_notice_minutes` field in `/admin/settings/business` SHALL be replaced with a segmented input composed of three integer fields: **Días**, **Horas**, **Minutos**. On load, the stored minutes value SHALL be decomposed into these three fields. On save, the three values SHALL be multiplied and summed back to a total minutes integer before the RPC call. A helper text SHALL read: "Tiempo mínimo de anticipación para que un cliente pueda reservar un turno. Ej: 2 horas significa que no se pueden reservar turnos con menos de 2 horas de anticipación."

#### Scenario: Stored value is decomposed on load
- **WHEN** `booking_min_notice_minutes = 150` (2 hours 30 minutes)
- **THEN** the Días field shows 0, Horas shows 2, Minutos shows 30

#### Scenario: Segmented input recombines on save
- **WHEN** the admin sets Días=1, Horas=2, Minutos=30 and saves
- **THEN** `booking_min_notice_minutes = 1*1440 + 2*60 + 30 = 1590` is sent to the RPC

#### Scenario: Helper text is visible
- **WHEN** the segmented duration field is rendered
- **THEN** the helper copy is shown below the field

### Requirement: Admin business settings booking max horizon has helper copy
The `booking_max_horizon_days` field in `/admin/settings/business` SHALL display a helper text: "Cuántos días hacia adelante puede reservar un cliente. Ej: 30 días significa que solo se pueden ver disponibilidades dentro del próximo mes."

#### Scenario: Helper text renders
- **WHEN** the admin views the booking horizon field
- **THEN** the helper text is visible below the input

### Requirement: Admin users deactivate action has helper tooltip
The "Desactivar" action in `/admin/users` SHALL display a tooltip or helper text: "El usuario no podrá iniciar sesión ni realizar reservas. Sus datos y reservas existentes se conservan."

#### Scenario: Tooltip/helper text is visible
- **WHEN** the admin hovers or taps the info indicator next to "Desactivar"
- **THEN** the helper text is shown

### Requirement: Admin staff page has mobile-first list layout
On viewports narrower than `md` (768px), the staff table at `/admin/staff` SHALL be replaced by a vertically stacked name list. Tapping a name SHALL toggle an inline expanded panel showing: linked user account email, role, and action buttons (Editar, Eliminar). On desktop, the table layout remains and the "Nombre" column header is renamed to "Nombre visible" and "Usuario vinculado" to "Cuenta".

#### Scenario: Mobile layout shows name list
- **WHEN** an admin views `/admin/staff` on a mobile viewport
- **THEN** only staff names are listed; no table columns are visible

#### Scenario: Tapping a name expands inline panel
- **WHEN** the admin taps a staff name on mobile
- **THEN** an inline panel appears below the name showing account email, role, and action buttons

#### Scenario: Desktop column headers updated
- **WHEN** an admin views `/admin/staff` on desktop
- **THEN** the first column reads "Nombre visible" and the account column reads "Cuenta"

### Requirement: Admin staff page has a FAB on mobile for adding professionals
On viewports narrower than `md`, the "Agregar profesional" button SHALL render as a fixed floating action button (FAB) at the bottom-right of the screen, replacing the top-right inline button.

#### Scenario: FAB visible on mobile
- **WHEN** the admin views `/admin/staff` on a mobile viewport
- **THEN** a FAB button is fixed at the bottom-right and the top-right inline button is hidden

#### Scenario: FAB hidden on desktop
- **WHEN** the admin views `/admin/staff` on a desktop viewport
- **THEN** the standard top-right button is shown and no FAB is present

### Requirement: Admin services page has two distinct sections
The `/admin/services` page SHALL be split into two clearly separated sections: **Servicios** (with its own "Agregar servicio" button) and **Categorías** (with its own "Agregar categoría" button).

#### Scenario: Two sections render
- **WHEN** an admin views `/admin/services`
- **THEN** a "Servicios" section and a "Categorías" section are both visible as separate areas of the page

### Requirement: Admin services page has mobile card layout
On viewports narrower than `md`, the services list in `/admin/services` SHALL replace the table layout with a card list showing: service name, category tag, price in ARS, active/inactive badge, and action icons.

#### Scenario: Mobile shows card list
- **WHEN** an admin views `/admin/services` on a mobile viewport
- **THEN** each service is rendered as a card with name, category, ARS price, status badge, and icons

#### Scenario: Desktop keeps table layout
- **WHEN** an admin views `/admin/services` on a desktop viewport
- **THEN** the table layout remains unchanged

### Requirement: Admin service form uses two-field duration input
The `duration_minutes` field in the service create/edit form SHALL be replaced with a two-field input composed of **Horas** and **Minutos**. On load, the stored minutes value SHALL be decomposed. On save, the two values SHALL be combined to minutes. A tooltip or inline help on "Capacidad simultánea" SHALL read: "Máximo de turnos que se pueden agendar al mismo tiempo para este servicio. Útil si tenés varias plazas o equipos disponibles. Dejá en blanco para ilimitado."

#### Scenario: Duration decomposed on load
- **WHEN** a service has `duration_minutes = 90`
- **THEN** the Horas field shows 1 and Minutos shows 30

#### Scenario: Duration combined on save
- **WHEN** admin sets Horas=1, Minutos=45 and saves
- **THEN** `duration_minutes = 105` is sent to the RPC

#### Scenario: Capacity tooltip visible
- **WHEN** the admin views the capacity field
- **THEN** a help indicator with the tooltip text is present

### Requirement: Admin service deactivate shows confirmation dialog
When the admin clicks "Desactivar" on a service, a confirmation dialog SHALL appear with the text: "Este servicio no aparecerá en el sistema de turnos y los clientes no podrán reservarlo. Los turnos existentes no se cancelan automáticamente." The action SHALL only proceed after the user confirms.

#### Scenario: Confirmation dialog shown
- **WHEN** the admin clicks "Desactivar" on a service
- **THEN** a dialog appears with the warning text and Confirm/Cancel buttons

#### Scenario: Action proceeds only after confirmation
- **WHEN** the admin confirms the dialog
- **THEN** the deactivate RPC is called

#### Scenario: Action cancelled
- **WHEN** the admin dismisses the dialog
- **THEN** the service remains active and no RPC is called

### Requirement: Admin service availability page has mobile UX improvements
On viewports narrower than `md`, the day-of-week checkboxes at `/admin/services/:id/availability` SHALL be replaced with a `<select>` dropdown for adding availability rules. The "Volver a servicios" full-width button SHALL be replaced with a top-left back arrow link ("← Servicios").

#### Scenario: Mobile shows dropdown for day selection
- **WHEN** the admin views the service availability page on mobile
- **THEN** a `<select>` dropdown is shown for day-of-week selection instead of checkboxes

#### Scenario: Back arrow replaces full-width button
- **WHEN** the admin views the service availability page
- **THEN** a top-left "← Servicios" link is present instead of a full-width "Volver a servicios" button

### Requirement: Admin landing settings uses color pickers and global font injection
In `/admin/settings/landing`, the `primary_color` and `secondary_color` inputs SHALL render as native `<input type="color">` pickers. Helper text SHALL clarify what each color affects: primary = hero overlay and buttons; secondary = card backgrounds and accents. On mobile, color and font inputs SHALL not overflow or misalign. The `font_family` configuration SHALL be applied to all body text, headings, and UI copy on the landing page by injecting `font-family` on the root HTML element, not just the hero section.

#### Scenario: Color pickers render with stored values
- **WHEN** the admin opens the landing settings page
- **THEN** both color pickers are pre-filled with stored hex values

#### Scenario: Helper text present for both color fields
- **WHEN** the admin views the color section
- **THEN** helper text is visible for primary and secondary color fields

#### Scenario: Mobile layout does not overflow
- **WHEN** the admin views the landing settings on a narrow mobile viewport
- **THEN** all color and font inputs are contained within the viewport width

#### Scenario: Font family applies to all landing page text
- **WHEN** a `font_family` is configured and the landing page is loaded
- **THEN** all body text, headings, and UI copy on `/` use the selected font, not just the hero section

### Requirement: Staff clients tab removed from navigation
The "Clientes" tab and its navigation entry SHALL be removed from the staff interface. The route `/staff/clients` and any associated page SHALL be removed or redirected.

#### Scenario: Clientes tab absent from staff navigation
- **WHEN** a staff user is authenticated and views the app shell
- **THEN** no "Clientes" link or tab is visible in the staff navigation

### Requirement: Mobile calendar view label shows "Diario" not "Semanal"
On viewports narrower than `md`, the tab/toggle labelled "Semanal" in `/appointments` and `/staff/appointments` SHALL be renamed to "Diario" or hidden entirely, since the single-day strip view is already active on mobile.

#### Scenario: Mobile shows "Diario" label
- **WHEN** the user views `/appointments` on a mobile viewport
- **THEN** the view mode toggle reads "Diario" (not "Semanal") for the day-strip view

#### Scenario: Desktop retains "Semanal" label
- **WHEN** the user views `/appointments` on a desktop viewport
- **THEN** the view mode toggle retains the "Semanal" label
