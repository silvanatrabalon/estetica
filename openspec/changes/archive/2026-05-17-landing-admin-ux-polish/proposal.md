## Why

The admin landing config panel (`/admin/settings/landing`) has several UX rough edges that make it harder to use: technical English labels ("Hero", "Landing") appear in a Spanish-language interface, the carousel image section is positioned below the save button causing confusion, and the typography selector lacks font previews and enough variety to make a meaningful choice. These are low-effort, high-impact polish improvements.

## What Changes

- Rename all admin-facing "Landing" / "Personalizar Landing" labels to **"Página pública"** — page title, nav entry, breadcrumbs.
- Rename section label "Sección principal (Hero)" → "Sección principal".
- Reorder form sections: move **Carrusel de imágenes** above the "Guardar cambios" button.
- In the **Tipografía** section: expand the font family options from 5 to 10+ curated Google Fonts and add a live preview sentence rendered in the currently selected font.

## Capabilities

### New Capabilities
- `landing-admin-ux-polish`: UX improvements to the admin landing config panel — label renaming, section reordering, and typography picker enhancements.

### Modified Capabilities
- `landing-config-admin`: The admin panel labels, section order, and typography UI are changing. No new requirements; existing requirements are clarified/refined.

## Impact

- `src/pages/LandingConfigPage.tsx` (or equivalent admin landing config page) — section order, labels
- `src/lib/navigation.ts` — admin nav entry label "Personalizar Landing" → "Página pública"
- Google Fonts `<link>` injection — must load all 10+ font families for the preview to render
- No DB changes, no new routes, no API changes
