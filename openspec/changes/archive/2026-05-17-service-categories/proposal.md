## Why

Services have no organizational structure. As the catalog grows, customers and admins struggle to find what they need. Adding categories lets the business group services by treatment type (e.g. "Manos", "Pies", "Cejas") so both the public landing page and the booking wizard expose focused, scannable lists. This also unblocks a visual redesign of the booking step 1 UI, which is currently too plain.

## What Changes

- New `service_categories` table: `(id, organization_id, name, display_order)`.
- `services` table gains a nullable `category_id` FK → `service_categories`.
- Admin RPCs: `admin_list_categories`, `admin_create_category`, `admin_update_category`, `admin_delete_category`.
- Existing `admin_list_services`, `admin_create_service`, `admin_update_service` RPCs updated to include `category_id`.
- Admin panel: "Categorías" CRUD UI section on the services page; create/edit service form adds a "Categoría" dropdown.
- Public landing page **Servicios** section: services grouped by category; uncategorized services shown last.
- Customer booking wizard Step 1: category filter tabs/chips above the service grid ("Todos" + one tab per category).
- Booking wizard Step 1 UI improved: better card spacing, visual hierarchy, mobile layout.

## Capabilities

### New Capabilities
- `service-categories`: Admin CRUD for service categories; `category_id` FK on services; category-based grouping on landing and booking wizard filter.

### Modified Capabilities
- `services-catalog-admin`: `admin_list_services`, `admin_create_service`, `admin_update_service` now include `category_id`.
- `public-landing-page`: Services section groups cards by category.
- `booking-experience-service-catalog`: Step 1 service selector adds category filter tabs; UI visual improvements.

## Impact

- DB: new migration — `service_categories` table, `services.category_id` column, updated admin RPCs, anon SELECT grant on `service_categories`
- `src/services/adminServices.ts` (or equivalent) — updated RPC wrappers
- `src/pages/AdminServicesPage.tsx` — category CRUD UI + service form dropdown
- `src/pages/LandingPage.tsx` — grouped services section
- `src/pages/BookingPage.tsx` — category filter tabs in Step 1
- No auth or RLS architectural changes beyond new table policies
