### Requirement: Apariencia menu groups everything the customer sees
The system SHALL provide an admin-only menu entry **Apariencia** at `/admin/appearance` as a single page without tabs (no "Marca" / "Sitio web" split) and without a "Ir al sitio web" link. The page MUST contain the landing page content form followed by the "Redes sociales" section. The menu MUST NOT contain a separate "Página pública" entry. The old path `/admin/settings/landing` MUST redirect to `/admin/appearance`.

#### Scenario: Admin sees Apariencia in the menu
- **WHEN** an admin views the navigation
- **THEN** an "Apariencia" entry pointing to `/admin/appearance` is shown and no "Página pública" entry exists

#### Scenario: Non-admins cannot access Apariencia
- **WHEN** a staff member, a customer or an unauthenticated visitor requests `/admin/appearance`
- **THEN** access is denied and the entry is not in their menu

#### Scenario: Old URL still works
- **WHEN** someone opens `/admin/settings/landing`
- **THEN** they are redirected to `/admin/appearance`

### Requirement: Brand form manages the logo
The "Logo" block MUST let the admin upload a logo (JPG, PNG, WEBP or GIF, up to 2 MB) or paste its URL, and remove it. Saving MUST write only the logo (the booking texts stored before stay untouched) and never business rules. Invalid files MUST be rejected with a Spanish message before anything is saved.

#### Scenario: Admin uploads and saves a logo
- **WHEN** the admin picks a valid image and presses "Guardar"
- **THEN** the image is stored and its public URL is saved as the logo

#### Scenario: Invalid logo file
- **WHEN** the admin picks a PDF or an image over 2 MB
- **THEN** a Spanish error is shown and nothing is uploaded

#### Scenario: Failed upload keeps the previous logo
- **WHEN** the upload fails
- **THEN** an error is shown and the previous logo is kept

#### Scenario: Removing the logo
- **WHEN** the admin presses "Quitar logo" and saves
- **THEN** the logo is stored as empty (null)

### Requirement: Logo appears in the top bar
The top bar MUST show the configured logo next to the business name for every role. If there is no logo, loading fails, or the image fails to load, nothing MUST be shown and the bar MUST still render.

#### Scenario: Logo shown
- **WHEN** a logo is configured
- **THEN** it is displayed in the top bar

#### Scenario: No logo or broken image
- **WHEN** no logo is configured, the lookup fails, or the image fails to load
- **THEN** no logo is shown and the rest of the bar is unaffected

### Requirement: The booking screen does not use the booking texts
The customer booking screen MUST NOT show a title or subtitle from the brand settings; the booking title and the line "Elegí el servicio que querés reservar." were removed. The stored values stay in the database, unused.

### Requirement: Saving business rules does not overwrite appearance
Saving the Negocio form MUST NOT write the logo, brand color or booking text columns. Those are written only when explicitly provided by a caller.

#### Scenario: Negocio save leaves branding untouched
- **WHEN** an admin saves the General tab of Negocio
- **THEN** the save request contains no logo, color or booking text fields

## Requirement: Bloques con Editar y popup
Apariencia MUST mostrarse como una sola lista de bloques con título, un resumen de lo guardado y un botón "Editar" que abre un popup (hoja inferior en celular, centrado desde sm) para esa parte. Bloques en orden: "Logo" (la pantalla de reservas ya no muestra título ni subtítulo, así que no hay bloque para esos textos; los valores guardados se conservan sin tocar), "Sección principal", "Sobre nosotros", "Diseño", "Horarios", "Carrusel de imágenes" y "Redes sociales". Cada popup guarda solo su parte, conserva lo demás como estaba, muestra sus errores adentro y se cierra con Cancelar o Escape sin guardar. El carrusel aplica los cambios al momento y solo tiene "Listo".

