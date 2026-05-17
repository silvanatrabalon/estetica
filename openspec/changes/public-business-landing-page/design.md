## Context

The app currently has no public surface. Every route either requires authentication or redirects to `/signin`. This is a B2C aesthetic services SaaS where customer acquisition depends on organic discovery: visitors share links, land on the URL, and decide whether to book. Without a public landing page the funnel is broken.

The existing codebase has services, business hours, and organization data in the database, but none of it is readable without a session. The `routePolicies` in `src/lib/routing.ts` marks every route as either `protected` or `public`; today `/` is `public` but renders nothing — it redirects to `roleHome`. Supabase Storage is not yet configured.

**Constraints:**
- All user-facing copy in Spanish
- No charting libraries introduced (per project conventions)
- Must not disrupt any existing authenticated routes
- Landing data must be editable by admin without a code deploy
- Shared `media` Storage bucket is a prerequisite for #38 (service image uploads)

---

## Goals / Non-Goals

**Goals:**
- Public `LandingPage` at `/` fully renderable without authentication
- Database-driven content: hero copy, about text, colors, font, social links, carousel images
- Admin config panel to edit all landing content from within the app
- Supabase Storage `media` bucket configured with public read + admin-only write
- Dynamic CSS theming via custom properties (no hardcoded palette)
- Graceful experience when `landing_config` row does not exist (sensible defaults rendered)

**Non-Goals:**
- SEO / SSR / Next.js migration — remains a client-side SPA
- Multi-organization / multi-tenant landing pages — single row per org
- Analytics or A/B testing
- Blog or CMS features
- Service image upload via this change (Storage bucket setup here; image upload UX in #38)
- Contact form with email sending (footer shows contact info only)

---

## Decisions

### D1 — Public data access: RPCs over anon SELECT grants

**Decision:** All landing data is fetched via SECURITY DEFINER RPCs (`get_landing_config()`, `list_services()` reused from booking flow) rather than granting anon SELECT on raw tables.

**Rationale:** Keeps RLS policies simple and auditable. Anon grants on raw tables would require RLS policies covering unauthenticated access to production tables — a security surface area that is hard to reason about. RPCs act as a controlled read API: they project only the columns needed, can apply org-level filters, and are independently grantable to the `anon` role without touching table-level policies.

**Alternative considered:** Grant anon SELECT on `landing_config`, `services`, and `business_hours` with RLS policies returning only published/active rows. Rejected because: (a) it couples RLS policy logic to public display rules, (b) `services` table already has staff/admin RLS that would need careful extension.

### D2 — Storage bucket: single `media` bucket with path prefixes

**Decision:** One Supabase Storage bucket named `media` with two path conventions: `carousel/<filename>` for landing carousel images and `services/<filename>` for service images (used in #38). Bucket is public (unauthenticated GET allowed). Write access controlled by Storage RLS: only `admin` role may INSERT/UPDATE/DELETE.

**Rationale:** Supabase Storage bills per bucket in some tiers and has per-bucket policy overhead. A single bucket with path-based organization is simpler to manage, and public CDN URLs for both use cases follow the same pattern. Separating buckets would require duplicating Storage RLS policies.

**Alternative considered:** Separate `carousel` and `services` buckets. Rejected: unnecessary overhead for MVP; path prefixes provide the same logical separation.

### D3 — Configuration table: dedicated `landing_config`, not extending `organizations`

**Decision:** New table `landing_config` with a `organization_id` foreign key (one-row-per-org constraint via UNIQUE). Does not add columns to the existing `organizations` table.

**Rationale:** `organizations` already has a schema used across the whole app. Adding 10+ landing-specific columns pollutes it and makes migrations harder to reason about. A separate table keeps concerns isolated and makes it easier to drop or extend landing features independently.

**Alternative considered:** Add columns to `organizations` or use a JSONB column on `organizations`. Rejected: JSONB loses type safety and complicates admin RPCs; column-per-field on `organizations` couples unrelated concerns.

### D4 — Dynamic theming: CSS custom properties injected at runtime

**Decision:** `LandingPage` reads `primary_color`, `secondary_color`, and `font_family` from `landing_config` and applies them as inline CSS custom properties on a wrapping `<div>` (e.g., `style={{ '--lp-primary': primaryColor, '--lp-secondary': secondaryColor }}`). Google Fonts loaded dynamically via a `<link>` element appended to `<head>` inside a `useEffect`.

**Rationale:** CSS custom properties are natively supported by all target browsers, require no build-time configuration, and allow Tailwind utility classes to reference them via `var(--lp-primary)` in arbitrary value syntax or a `style` attribute. Font injection via `useEffect` avoids adding a static `<link>` in `index.html` for a font that changes per config.

**Alternative considered:** Use Tailwind `safelist` with a fixed palette. Rejected: defeats the purpose of admin-configurable colors; the palette would be limited to predefined Tailwind values.

### D5 — Admin/staff redirect from `/`

**Decision:** The existing `App.tsx` authentication flow already redirects `admin` and `staff` users to `roleHome`. The `LandingPage` at `/` is rendered only when: (a) the user is unauthenticated, or (b) the user has the `customer` role. No changes needed to `routePolicies` — `/` stays `public`. The redirect logic in `App.tsx` handles admin/staff.

**Rationale:** Keeps routing logic centralized in one place. Adding role-based redirect logic inside `LandingPage` itself would duplicate routing concerns.

### D6 — Carousel: paths stored in DB, public URLs resolved client-side

**Decision:** `landing_carousel_images.storage_path` stores the Storage path (e.g., `carousel/filename.jpg`). The frontend resolves the public CDN URL using `supabase.storage.from('media').getPublicUrl(path).data.publicUrl`. No full URLs stored in the database.

**Rationale:** Decouples stored data from the Supabase project URL. If the project URL changes (e.g., migration), paths remain valid and URLs are recalculated. Storing full URLs would require a data migration on any infrastructure change.

### D7 — Landing page sections always rendered; hours/about gated by config flags

**Decision:** All section components are always mounted. `show_hours` flag in `landing_config` controls whether the Horarios section is visible. `about_text` being null/empty hides the Sobre Nosotros section. This is simpler than conditional routing.

**Rationale:** Avoids section-level feature flags that would need to be managed in the admin panel UI. A missing `about_text` = no section displayed is a natural default.

---

## Risks / Trade-offs

**[Risk] First paint is slow if `get_landing_config()` is slow** → Mitigation: keep the RPC lightweight (single row join); display skeleton/placeholder sections while loading. Do not block render on data.

**[Risk] Supabase Storage public bucket exposes all `media/` files to anyone with a URL** → Mitigation: filenames are UUIDs or hash-based; no sensitive data should be stored in `media/`. This is intentional for a public-facing landing page.

**[Risk] Admin uploads wrong aspect-ratio carousel image → layout breaks** → Mitigation: document recommended aspect ratio in admin panel UI; no server-side enforcement for MVP.

**[Risk] `landing_config` row does not exist on first load (no org config yet)** → Mitigation: `get_landing_config()` returns a row with all-null fields; frontend applies hardcoded defaults for each field when value is null. Landing page always renders.

**[Risk] Google Fonts dynamic injection adds a render-blocking request** → Mitigation: inject with `font-display: swap` via URL parameter; this is acceptable for MVP. SSR-based font preloading is a non-goal.

**[Risk] Storage RLS misconfiguration allows public writes** → Mitigation: Storage policy explicitly checks `auth.role() = 'authenticated'` AND user has `admin` role via `user_roles` lookup. Anon write is never granted.

---

## Migration Plan

1. **Apply migration** — `landing_config` table, `landing_carousel_images` table, RPC functions, anon grants
2. **Configure Storage** — Create `media` bucket in Supabase dashboard (or via seed/migration if Storage API supports it), set to public
3. **Deploy frontend** — `LandingPage`, `LandingConfigPage`, updated routing and navigation
4. **Admin seeds config** — Admin logs in, navigates to `/admin/settings/landing`, fills in hero copy and uploads at least one carousel image
5. **Verify** — Open `/` in incognito: landing renders with defaults if not configured, or with real content if configured

**Rollback:** If `LandingPage` causes issues, revert the `/` route to the old redirect behavior in `App.tsx`. No data migration rollback needed — new tables and RPCs do not affect existing functionality.

---

## Open Questions

- **Q1:** Should `landing_carousel_images` support per-image link URLs (e.g., clicking a slide goes to a service)? → Deferred to post-MVP; not in scope for this change.
- **Q2:** Should the public `get_landing_config()` RPC also return `services` and `business_hours` in a single call to minimize round trips? → Decision: keep RPCs separate; `services` data already has a `list_services()` RPC used by booking flow. Composing on the frontend with `Promise.all` is simpler.
- **Q3:** Carousel auto-play interval — configurable or hardcoded? → Hardcoded at 4 seconds for MVP; can be made configurable in a later iteration.
