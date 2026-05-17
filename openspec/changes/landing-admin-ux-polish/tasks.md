## 1. Navigation & Labels

- [x] 1.1 In `src/lib/navigation.ts`, update the admin nav entry for `/admin/settings/landing`: change `label` from "Personalizar Landing" (or equivalent) to "Página pública"
- [x] 1.2 In `LandingConfigPage.tsx`, update the page heading/title to "Página pública"
- [x] 1.3 In `LandingConfigPage.tsx`, rename the form section "Sección principal (Hero)" to "Sección principal"

## 2. Form Section Reordering

- [x] 2.1 In `LandingConfigPage.tsx`, move the **Carrusel de imágenes** section above the "Guardar cambios" button (it must appear before any primary action buttons)

## 3. Typography Picker Enhancement

- [x] 3.1 In `LandingConfigPage.tsx`, expand the `FONT_OPTIONS` array to include at least 10 curated Google Fonts: Inter, Playfair Display, Lato, Nunito, Raleway, DM Sans, Cormorant Garamond, Josefin Sans, Montserrat, Libre Baskerville
- [x] 3.2 Update the Google Fonts `useEffect` to inject a single composite `<link>` URL loading all 10+ families on page mount (e.g. `https://fonts.googleapis.com/css2?family=Inter&family=Playfair+Display&...`)
- [x] 3.3 Below the font family `<select>`, add a preview `<p>` element: text "El rápido zorro marrón salta sobre el perro perezoso", styled with `fontFamily: selectedFont, fontSize: '1.125rem'`
- [x] 3.4 Ensure the preview updates reactively when the selected font changes (no save required)

## 4. Verification

- [x] 4.1 Verify no occurrence of the word "Landing" or "Hero" remains in any admin-facing visible label or heading in `LandingConfigPage.tsx` and `navigation.ts`
- [x] 4.2 Verify all 10+ font families render correctly in the preview on the admin panel
- [x] 4.3 Check TypeScript compilation passes with no errors (`npx tsc --noEmit`)
