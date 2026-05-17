## Why

The app currently has no public-facing presence — the `/` route is a redirect wall that requires authentication before a visitor sees anything meaningful. Prospective customers cannot discover the business, browse services, or understand pricing without first signing up. This blocks organic customer acquisition and creates a poor first impression. A modern aesthetic services business needs a beautiful, public landing page that converts visitors into bookings.

## What Changes

- Replace the current `/` redirect behavior with a fully public `LandingPage` component — no login required
- Authenticated admin/staff visiting `/` are redirected to their role home; authenticated customers see the landing with a direct booking CTA
- New Supabase Storage bucket `media` (public read, admin-only write) for carousel and service images
- New `landing_config` table: one row per organization storing hero copy, about text, social links, color palette, font family, and hours visibility toggle
- New `landing_carousel_images` table: ordered list of carousel image paths per organization
- New SECURITY DEFINER RPCs: `get_landing_config()` (public/anon), `admin_get_landing_config()`, `admin_upsert_landing_config()`, and carousel image management RPCs
- New admin panel at `/admin/settings/landing` for configuring all landing content
- New nav entry "Personalizar Landing" in admin settings section
- TypeScript service layers: `src/services/landing.ts` and `src/services/adminLanding.ts` with Storage upload helpers
- Anon SELECT grants added for `services`, `business_hours`, and `organizations` tables (minimal read access for the public landing)
- Dynamic CSS custom properties applied from `landing_config` for theming (primary/secondary color, font family)

## Capabilities

### New Capabilities

- `public-landing-page`: Public-facing business showcase at `/` — hero carousel, services grid, about section, business hours, social links footer, and booking CTA; fully accessible without authentication
- `landing-config-admin`: Admin-only configuration panel at `/admin/settings/landing` for managing landing copy, carousel images (upload/reorder/delete), color palette, font family, social URLs, and hours visibility
- `media-storage`: Supabase Storage bucket `media` with public read access and admin-only write, shared between carousel images and service images (#38)

### Modified Capabilities

- `services-catalog-admin`: Service images now served from Supabase Storage (shared `media` bucket) instead of external URLs only — the `image_url` column is retained but populated via Storage upload in #38; no spec-level requirement change for this item (upload UX is in #38)

## Impact

- **Routing**: `/` route changes from redirect-only to a real page component; `App.tsx` and `ProtectedRoute` logic updated to redirect authenticated admin/staff away from `/`
- **Navigation**: New admin nav entry "Personalizar Landing" added to `navigationByRole.admin`; new route `/admin/settings/landing` registered in `routePolicies`
- **Database**: 2 new tables (`landing_config`, `landing_carousel_images`), 1 new Storage bucket (`media`), 6 new SECURITY DEFINER RPCs, anon grants on 3 existing tables
- **Dependencies**: Supabase Storage must be enabled and configured; `@supabase/storage-js` is already included via `@supabase/supabase-js`
- **No breaking changes**: All existing routes, RPCs, and components are unchanged
