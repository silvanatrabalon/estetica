## 1. Storage Infrastructure

- [x] 1.1 Create `media` Supabase Storage bucket (public read) via Supabase dashboard or migration
- [x] 1.2 Add Storage RLS policy: anon + authenticated SELECT (read all objects in `media`)
- [x] 1.3 Add Storage RLS policy: admin-only INSERT/UPDATE/DELETE (verify `user_roles` for `admin`)

## 2. Database Migration

- [x] 2.1 Create migration: `landing_config` table with all columns, defaults, and UNIQUE constraint on `organization_id`
- [x] 2.2 Create migration: `landing_carousel_images` table with foreign key to `organizations`
- [x] 2.3 Add `get_landing_config()` SECURITY DEFINER function granted to `anon` and `authenticated`
- [x] 2.4 Add `admin_get_landing_config()` SECURITY DEFINER function (admin-only, raises `LANDING_NOT_AUTHORIZED`)
- [x] 2.5 Add `admin_upsert_landing_config(...)` SECURITY DEFINER function (admin-only, upsert on `organization_id`)
- [x] 2.6 Add `admin_add_carousel_image(p_storage_path, p_alt_text)` SECURITY DEFINER function (admin-only)
- [x] 2.7 Add `admin_remove_carousel_image(p_image_id)` SECURITY DEFINER function (admin-only)
- [x] 2.8 Add `admin_reorder_carousel_images(p_ordered_ids uuid[])` SECURITY DEFINER function (admin-only)
- [x] 2.9 Grant `anon` role SELECT on `services`, `business_hours`, and `organizations` for public landing reads

## 3. TypeScript Service Layer

- [x] 3.1 Create `src/services/landing.ts`: `getLandingConfig()` calling `get_landing_config()`, returning typed `LandingConfig`
- [x] 3.2 Define `LandingConfig` and `CarouselImage` TypeScript types (in `src/services/landing.ts` or `src/types/`)
- [x] 3.3 Create `src/services/adminLanding.ts`: `adminGetLandingConfig()`, `adminUpsertLandingConfig(data)`, `adminAddCarouselImage()`, `adminRemoveCarouselImage()`, `adminReorderCarouselImages()`
- [x] 3.4 Add `uploadMediaFile(bucket, path, file)` Storage helper to `adminLanding.ts` returning public URL
- [x] 3.5 Add `deleteMediaFile(bucket, path)` Storage helper to `adminLanding.ts`
- [x] 3.6 Export new services from `src/services/index.ts`

## 4. Public Landing Page

- [x] 4.1 Create `src/pages/LandingPage.tsx`: page shell with CSS custom properties applied to root `<div>` and Google Fonts `useEffect`
- [x] 4.2 Implement `HeroSection` component: headline, subtitle, CTA button (auth-aware redirect logic), full-width carousel
- [x] 4.3 Implement `CarouselSection` sub-component: auto-cycle at 4s, dot indicators, prev/next arrows, single-image static fallback
- [x] 4.4 Implement `ServicesSection` component: grid of service cards (name, price in ARS, image or placeholder), calls `getLandingConfig()` + direct anon SELECT via `Promise.all`
- [x] 4.5 Implement `AboutSection` component: renders `about_text`; hidden when null/empty
- [x] 4.6 Implement `HoursSection` component: renders `business_hours` data; hidden when `show_hours` is `false`
- [x] 4.7 Implement `ContactFooter` component: Instagram link, WhatsApp link; hidden per-link when field is null
- [x] 4.8 Wire all sections into `LandingPage.tsx` with loading skeleton state
- [x] 4.9 Register `/` route in `App.tsx` to render `LandingPage` (public); ensure admin/staff redirect to `roleHome` via existing auth logic

## 5. Admin Landing Config Panel

- [x] 5.1 Create `src/pages/LandingConfigPage.tsx`: page scaffold with admin role check
- [x] 5.2 Implement hero fields form section: `hero_title`, `hero_subtitle` text inputs with Spanish labels
- [x] 5.3 Implement about fields form section: `about_text` textarea
- [x] 5.4 Implement contact/social fields form section: `instagram_url`, `whatsapp_number` inputs
- [x] 5.5 Implement design fields form section: `primary_color`, `secondary_color` color pickers, `font_family` select
- [x] 5.6 Implement `show_hours` toggle in form
- [x] 5.7 Wire form save to `adminUpsertLandingConfig()` with Spanish success/error feedback
- [x] 5.8 Implement carousel image manager: display ordered list of current images with delete button per image
- [x] 5.9 Implement carousel image upload: file input (image types only), `uploadMediaFile()` + `adminAddCarouselImage()` on select
- [x] 5.10 Implement carousel image reorder: drag-to-reorder list calling `adminReorderCarouselImages()` on drop
- [x] 5.11 Implement carousel image delete: confirmation dialog + `adminRemoveCarouselImage()` + `deleteMediaFile()`
- [x] 5.12 Load existing config on mount via `adminGetLandingConfig()` and pre-populate all form fields

## 6. Routing & Navigation

- [x] 6.1 Register `/admin/settings/landing` route in `routePolicies` with `admin` role guard, rendering `LandingConfigPage`
- [x] 6.2 Add "Personalizar Landing" entry to `navigationByRole.admin` in `src/lib/navigation.ts`
- [x] 6.3 Export `LandingPage` and `LandingConfigPage` from `src/pages/index.ts`

## 7. Verification

- [x] 7.1 Verify `/` loads without authentication in incognito (no redirect to `/signin`)
- [x] 7.2 Verify admin navigating to `/` is redirected to their role home
- [x] 7.3 Verify admin can save landing config and changes appear on the public page
- [x] 7.4 Verify carousel image upload, reorder, and delete flow end-to-end
- [x] 7.5 Verify non-image file upload is rejected with Spanish error in the admin panel
- [x] 7.6 Verify non-admin authenticated user cannot access `/admin/settings/landing`
- [x] 7.7 Verify `get_landing_config()` returns null-field row when no config exists and landing page renders with defaults
