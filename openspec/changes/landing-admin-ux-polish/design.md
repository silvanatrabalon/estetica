## Context

The admin landing config page (`/admin/settings/landing`) was implemented in `public-business-landing-page` (#37). Several UX issues were identified post-implementation:

1. **Language inconsistency**: "Hero" and "Landing" are English technical terms visible in a Spanish admin UI.
2. **Section order**: The carousel image manager renders below the "Guardar cambios" button, which is semantically wrong — users may not realize images can be managed on the same page.
3. **Typography picker**: Currently offers only 5 font families, with no preview. Admins cannot evaluate a font without saving and navigating to the public page.

This is a pure frontend change. No DB migrations, RPC changes, or route changes are needed.

## Goals / Non-Goals

**Goals:**
- Replace all admin-facing "Landing"/"Hero" copy with plain Spanish equivalents.
- Reorder the `LandingConfigPage` form so carousel management appears before the save button.
- Expand the font family list to 10+ Google Fonts options.
- Render a live font preview sentence in the selected font inside the typography section.

**Non-Goals:**
- Changing the URL `/admin/settings/landing` (URL is not user-facing in navigation; only the label changes).
- Redesigning the full page layout or adding new configuration fields.
- Supporting multiple font families simultaneously.

## Decisions

### 1. Keep the route path `/admin/settings/landing` unchanged
Changing the route would require updating `navigation.ts`, `routePolicies`, `App.tsx`, and potentially breaking bookmarks. Only the visible nav label and page title change. Rationale: minimal blast radius for a polish item.

### 2. Load all 10+ Google Fonts in the typography section
The existing implementation injects one `<link>` for the selected font. For the live preview to work across all options, all fonts must be preloaded when the typography section is visible. Approach: inject a single composite Google Fonts URL (`family=Inter&family=Playfair+Display&...`) in a `useEffect` when the page mounts. This is a one-time network cost (~20 KB total for all families) and is acceptable for an admin-only page.

### 3. Font preview sentence
Render a `<p>` styled with `fontFamily: selectedFont` immediately below the selector. The sentence "El rápido zorro marrón salta sobre el perro perezoso" covers a wide range of characters and gives a representative preview. No external dependency needed — pure inline CSS.

## Risks / Trade-offs

- [Risk] Google Fonts CDN unavailable in the admin's network → Mitigation: font fallback chain already in Tailwind config; preview degrades gracefully to the system font.
- [Risk] "Página pública" is longer than "Landing" and may overflow narrow nav items → Mitigation: the existing nav already handles "Configuración del negocio" (longer string); no overflow issue expected.
