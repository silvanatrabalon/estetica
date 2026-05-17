## Why

The services catalog and booking wizard use plain text lists with no visual differentiation between services. Customers cannot see what a service looks like or read a description before booking, and admins cannot attach images or descriptions to services. This change introduces visual richness to both the booking flow and the admin panel, leveraging the Storage bucket and media helpers introduced in #37.

## What Changes

- Add a nullable `description` column to the `services` table and update the related admin RPCs to accept and return it
- Replace the `image_url` text input in `AdminServicesPage` with a file upload component backed by Supabase Storage (`media` bucket, `services/` path prefix)
- Add a `description` textarea to the service create/edit form in `AdminServicesPage`
- Replace the plain list in BookingPage Step 1 with a responsive image card grid (2 columns mobile, 3 desktop) with hover/selection states
- Add a service detail bottom drawer (mobile) / side panel (desktop) for reading the full description before selecting

## Capabilities

### New Capabilities
- `service-description`: Nullable text description field on services — DB column, RPC support, admin form, and customer-facing display
- `service-image-upload`: Admin file upload for service images via Supabase Storage (`media/services/` prefix); replaces the free-text `image_url` field
- `service-card-grid`: Responsive card grid UI for service selection in BookingPage Step 1 with image, name, price, duration, description, and selection states
- `service-detail-panel`: Service detail drawer/side panel triggered from a card for reading the full description before committing to a selection

### Modified Capabilities
- `services-catalog-admin`: Admin service form gains `description` textarea and image upload (replaces `image_url` text input); `AdminService` interface gains `description: string | null`

## Impact

- **Database**: One migration — `ALTER TABLE services ADD COLUMN description text`; updated `admin_list_services()`, `admin_create_service()`, `admin_update_service()` RPCs
- **Services layer**: `src/services/adminServices.ts` — `AdminService` interface + mapper + RPC call signatures updated; `uploadMediaFile()` / `deleteMediaFile()` reused from `src/services/adminLanding.ts`
- **Pages**: `AdminServicesPage.tsx` — form and list updated; `BookingPage.tsx` — Step 1 component replaced
- **Components**: New `ServiceCard`, `ServiceCardGrid`, `ServiceDetailPanel` components (or inline in BookingPage)
- **Dependencies**: No new npm packages; `@dnd-kit` not needed; reuses Supabase Storage already configured in #37
- **Tests**: New unit + integration tests for description/image form fields, card grid rendering, drawer behavior, upload flow
