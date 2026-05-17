## Context

Services are currently a flat list. The `services` table has no grouping column. The public landing and booking wizard both render services as an ungrouped flat grid. The admin creates services one by one with no ability to assign a type/category.

A `service_categories` table (one row per category, ordered by `display_order`) owned by the organization is the canonical way to introduce this structure while keeping the services table normalized. The FK on `services.category_id` is nullable — existing services remain valid without a category.

## Goals / Non-Goals

**Goals:**
- Introduce `service_categories` with admin CRUD.
- Add `category_id` FK on `services` (nullable, no migration required for existing rows).
- Surface categories as filter tabs in the booking wizard Step 1 and as section headers on the landing page.
- Improve the visual quality of the booking wizard Step 1 card grid as part of this item.

**Non-Goals:**
- Multiple categories per service (one category per service in MVP).
- Category images or icons (name only).
- Category visibility toggle (all categories with at least one active service are shown).
- Nested / hierarchical categories.

## Decisions

### 1. `service_categories` as a separate table (not an enum)
Admin must be able to create, rename, and delete categories without a DB migration. A table with a `name text` column is the correct model. Alternative (enum type) rejected — requires `ALTER TYPE` for each change.

### 2. Nullable `category_id` on `services`
Existing services must not break when the column is added. `NULL` means "uncategorized" — these services appear in a trailing group on the landing and are included under the "Todos" tab in the booking wizard. Rationale: zero-downtime migration, no forced backfill.

### 3. Admin RPCs follow existing SECURITY DEFINER pattern
`admin_create_category`, `admin_update_category`, `admin_delete_category`, `admin_list_categories` — same pattern as `admin_create_service` etc. No direct DML grants. `admin_delete_category` raises an error if any service still references it (prevents orphaned `category_id` values).

### 4. Anon SELECT on `service_categories`
The public landing page and the booking wizard (which loads before auth completes for unauthenticated visitors) need to read categories. Grant `SELECT` on `service_categories` to `anon` (same as `services`). RLS: public read policy, no direct write.

### 5. Category filter in booking wizard — client-side filtering
The full service list is already fetched at Step 1. Category filtering is done client-side on the already-loaded `services` array. No additional RPC call needed. Rationale: service catalog is small (< 50 rows); a second RPC for filtered results would add latency with no benefit.

### 6. Landing page grouping — client-side
`getLandingConfig()` already fetches services via `list_services()`. Group them by `category_id` client-side using the categories array also returned by `get_landing_config()` (or a separate `list_categories()` call). Prefer extending `get_landing_config()` response to include categories to keep public page to one RPC call.

## Risks / Trade-offs

- [Risk] Admin deletes a category that has services → Mitigation: `admin_delete_category` checks for dependent services and raises a named error ("Esta categoría tiene servicios asignados. Reasignalos antes de eliminar.").
- [Risk] `list_services()` already granted to anon — adding `category_id` to its return is a non-breaking additive change.
- [Risk] Booking wizard UI improvement scope creep → Mitigation: scope is limited to Step 1 only (card spacing, filter tabs, mobile layout). Steps 2–4 unchanged.
