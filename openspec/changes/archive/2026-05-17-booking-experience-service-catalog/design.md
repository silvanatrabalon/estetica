## Context

The services catalog today uses plain text lists in both the admin panel (service create/edit) and the customer booking wizard (Step 1: service selection). The `services` table has an `image_url text` column populated via a free-text input, which is fragile and requires the admin to manage external URLs. Supabase Storage (`media` bucket, `carousel/` prefix) was introduced in #37. This change extends it to service images and adds a `description` column, then upgrades both the admin UI and the booking wizard to consume them.

Current codebase touchpoints:
- `src/pages/AdminServicesPage.tsx` — service list + inline create/edit form
- `src/services/adminServices.ts` — `AdminService` interface, `adminListServices()`, `adminCreateService()`, `adminUpdateService()`
- `src/pages/BookingPage.tsx` — Step 1 uses a plain `<ul>` of services driven by `useActiveServices()` hook
- `src/services/adminLanding.ts` — already exports `uploadMediaFile()` and `deleteMediaFile()`

## Goals / Non-Goals

**Goals:**
- Add `description text` (nullable) to the `services` table and expose it in all relevant RPCs
- Replace the `image_url` free-text input with a file upload component in the admin panel
- Show service image and description in the booking wizard Step 1 as a visual card grid
- Provide a service detail drawer/panel for reading the full description before selection
- Keep zero new npm dependencies — reuse existing Supabase Storage helpers

**Non-Goals:**
- Multiple images per service (single image, overwrite on re-upload)
- Video or carousel media per service
- Booking wizard steps 2–4 visual redesign
- Customer reviews, ratings, or comments
- Service categories or grouping

## Decisions

**D1 — Storage path: `services/{serviceId}.{ext}` with overwrite semantics**
Each service has at most one image. Using the `serviceId` as filename means re-uploading simply overwrites the previous file without orphaning objects. Alternative considered: timestamped paths (e.g., `services/{serviceId}/{timestamp}.jpg`) — rejected because it creates orphaned files on each upload and complicates deletion (would need to track the path separately in the DB).

**D2 — `image_url` column type unchanged (`text`) — now holds Storage public URLs**
The existing column already stores URLs; changing to a Storage-backed public URL is a drop-in replacement. No DB column rename or type change is needed. The admin UI swaps the input widget, not the data model.

**D3 — `uploadMediaFile()` / `deleteMediaFile()` reused from `adminLanding.ts` via re-export in `services/index.ts`**
Both helpers are already tested and in production. No new abstraction is introduced. Alternative: duplicate the helpers in `adminServices.ts` — rejected to avoid duplication.

**D4 — Service card grid built inline in `BookingPage.tsx` (no separate shared component file)**
The card grid is only used in BookingPage Step 1. Premature extraction into `components/` would add indirection without reuse. Can be extracted later if #38d or another feature reuses it.

**D5 — Service detail panel as a controlled sheet/drawer (no routing)**
Opening the detail panel does not change the URL. The panel is toggled via `useState` on the selected card index. Alternative: a dedicated route per service (e.g., `/booking/services/:id`) — rejected because it adds URL complexity and navigation overhead for what is a transient read-only view.

**D6 — `primary_color` from `getLandingConfig()` used as placeholder background for services without images**
`getLandingConfig()` is already called in `LandingPage`. In `BookingPage`, it is called once on mount alongside `useActiveServices()` and stored in local state. If the call fails, a neutral pastel fallback (`#f3e8ff`) is used. Alternative: hardcode the fallback — accepted as a fallback but the landing config color is preferred for visual coherence.

**D7 — `description` textarea: no minimum length validation**
Description is entirely optional. Requiring content would block admins who don't have copy ready. Validation is only applied to ensure it's a string (not enforced at DB level via CHECK constraint).

## Risks / Trade-offs

- **Storage orphaning on service deletion**: If a service is deactivated (soft delete), its Storage object at `services/{serviceId}.{ext}` is not automatically removed. Mitigation: document this as a known limitation; a future cleanup job can scan for orphaned objects. Acceptable for MVP.
- **`getLandingConfig()` adds a request to BookingPage load**: One extra RPC call on mount. Mitigation: call it in `Promise.all` alongside `useActiveServices()` so it doesn't add latency sequentially. If it fails, the placeholder color degrades gracefully.
- **Image upload UX latency**: Uploading to Storage on file select (before the user saves the service form) means the image may be uploaded for a service that is ultimately not saved. Mitigation: upload fires after the user picks the file, not on form submit — standard pattern; acceptable for MVP volume.

## Migration Plan

1. Deploy migration: `ALTER TABLE services ADD COLUMN description text` + updated RPC function bodies
2. Push migration with `npx supabase db push`
3. Deploy frontend changes — backwards compatible (new fields are optional, old records have `description = null`)
4. No rollback complexity — `description` column is additive; removing it later is a trivial migration

## Open Questions

None — all decisions are resolved per the backlog spec.
