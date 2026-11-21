## 1. Services and logic

- [x] 1.1 `src/lib/brand.ts`: limits, defaults, validation, `resolveBookingTexts`
- [x] 1.2 `src/services/brand.ts`: public `getBrandSettings`, `saveBrandSettings` (branding columns only)
- [x] 1.3 `saveBusinessSettings`: branding fields optional and written only when provided

## 2. Apariencia UI

- [x] 2.1 `BrandSettingsForm` (logo upload/URL/remove, booking title and subtitle)
- [x] 2.2 `AppearancePage` with tabs Marca y reservas / Página pública
- [x] 2.3 `LandingConfigPage` renders as a panel (no own title); social editor shown below the page content in the Página pública tab
- [x] 2.4 Menu entry "Apariencia", route `/admin/appearance`, redirect from `/admin/settings/landing`

## 3. Make fields visible

- [x] 3.1 `BrandLogo` in the top bar
- [x] 3.2 Booking screen uses configured title and subtitle with fallbacks

## 4. Negocio cleanup

- [x] 4.1 Tab "Identidad" → "General"; remove logo, color and booking text fields

## 5. Tests

- [x] 5.1 Brand lib and service tests, including limits and blanks
- [x] 5.2 Component tests: brand form, logo, appearance tabs, booking texts
- [x] 5.3 Routing and menu tests: admin-only, no Página pública entry
- [x] 5.4 Negocio no longer sends branding fields
