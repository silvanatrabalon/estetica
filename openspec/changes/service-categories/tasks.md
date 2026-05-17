## 1. Database

- [x] 1.1 Create migration: `service_categories` table (`id uuid PK`, `organization_id uuid FK organizations`, `name text NOT NULL`, `display_order int NOT NULL DEFAULT 0`, `created_at timestamptz`, `updated_at timestamptz`); unique constraint on `(organization_id, name)`
- [x] 1.2 Create migration: `ALTER TABLE services ADD COLUMN category_id uuid REFERENCES service_categories(id) ON DELETE SET NULL` (nullable)
- [x] 1.3 Add RLS on `service_categories`: `SELECT` policy for `anon` and `authenticated` (public read); no direct DML — admin writes through RPCs
- [x] 1.4 Grant `SELECT` on `service_categories` to `anon` and `authenticated`

## 2. Admin RPCs

- [x] 2.1 Create `admin_list_categories()` SECURITY DEFINER — returns all categories for the org ordered by `display_order`; admin-only
- [x] 2.2 Create `admin_create_category(p_name text, p_display_order int)` SECURITY DEFINER — inserts a new category; raises error on duplicate name; admin-only
- [x] 2.3 Create `admin_update_category(p_id uuid, p_name text, p_display_order int)` SECURITY DEFINER — updates name/order; admin-only
- [x] 2.4 Create `admin_delete_category(p_id uuid)` SECURITY DEFINER — checks no services reference this id; raises named Spanish error if dependent services exist; admin-only
- [x] 2.5 Update `admin_list_services()` to JOIN `service_categories` and return `category_id`, `category_name` (nullable)
- [x] 2.6 Update `admin_create_service()` to accept optional `p_category_id uuid`
- [x] 2.7 Update `admin_update_service()` to accept optional `p_category_id uuid`
- [x] 2.8 Update public `list_services()` to return `category_id` and `category_name`

## 3. TypeScript Services

- [x] 3.1 Add `ServiceCategory { id, name, displayOrder }` interface and `adminListCategories()`, `adminCreateCategory()`, `adminUpdateCategory()`, `adminDeleteCategory()` in `src/services/adminCategories.ts`
- [x] 3.2 Update `AdminService` interface to include `categoryId: string | null`, `categoryName: string | null`
- [x] 3.3 Update `adminCreateService()` and `adminUpdateService()` wrappers to pass `categoryId`
- [x] 3.4 Update `Service` (public) interface to include `categoryId: string | null`, `categoryName: string | null`

## 4. Admin UI — Category Management

- [x] 4.1 In `AdminServicesPage.tsx`, add a "Categorías" collapsible section or tab with a list of existing categories; each row has edit/delete actions
- [x] 4.2 Add "Nueva categoría" inline form (name input + save button)
- [x] 4.3 Wire create/update/delete to the new service functions; show Spanish success and error states
- [x] 4.4 Add "Categoría" dropdown to the create/edit service form, populated by `adminListCategories()`; default: "Sin categoría"

## 5. Public Landing Page

- [x] 5.1 In `LandingPage.tsx`, group services by `categoryId` client-side after fetching
- [x] 5.2 Render each category as a `<h3>` subheading followed by its service cards
- [x] 5.3 Render uncategorized services after all categorized groups (no subheading or "Otros" label)
- [x] 5.4 Skip rendering a category subheading if it has zero active services

## 6. Booking Wizard Step 1

- [x] 6.1 In `BookingPage.tsx` Step 1, fetch categories alongside services on mount
- [x] 6.2 Render "Todos" + one chip/tab per category that has ≥ 1 active service above the grid
- [x] 6.3 Implement client-side filter: selecting a tab sets `activeCategoryId`; grid renders only matching services (or all if "Todos")
- [x] 6.4 Improve card grid CSS: adequate gap, card min-height, service name prominent (`font-semibold`), price secondary, single column on mobile (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)

## 7. Migrations & Verification

- [x] 7.1 Run `npx supabase db push` and verify all migrations apply cleanly
- [x] 7.2 Run `npx vitest run` and confirm all existing tests pass
- [x] 7.3 Verify TypeScript compiles with no errors (`npx tsc --noEmit`)
