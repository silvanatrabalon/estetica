## 1. Database Migration

- [x] 1.1 Create migration file `supabase/migrations/<timestamp>_service_description.sql`
- [x] 1.2 Add `ALTER TABLE services ADD COLUMN IF NOT EXISTS description text` to the migration
- [x] 1.3 Update `admin_list_services()` RPC to include `description` in the SELECT and return type
- [x] 1.4 Update `admin_create_service()` RPC to accept `p_description text DEFAULT NULL` parameter and INSERT it
- [x] 1.5 Update `admin_update_service()` RPC to accept `p_description text DEFAULT NULL` parameter and SET it
- [x] 1.6 Push migration with `npx supabase db push` and verify in Supabase dashboard

## 2. Services Layer (TypeScript)

- [x] 2.1 Add `description: string | null` to the `AdminService` interface in `src/services/adminServices.ts`
- [x] 2.2 Update the `adminListServices()` mapper to include `description` from the RPC result
- [x] 2.3 Update `adminCreateService()` call signature to accept and pass `description: string | null`
- [x] 2.4 Update `adminUpdateService()` call signature to accept and pass `description: string | null`
- [x] 2.5 Re-export `uploadMediaFile` and `deleteMediaFile` from `src/services/index.ts` (if not already exported)

## 3. Admin Services Page — Description Field

- [x] 3.1 Add a `description` textarea field to the service create/edit form in `AdminServicesPage.tsx`
- [x] 3.2 Wire the textarea to form state (controlled input, initially `""` or `service.description ?? ""`)
- [x] 3.3 Map the textarea value to `description: value || null` before passing to `adminCreateService()` / `adminUpdateService()`
- [x] 3.4 Display a truncated description preview in the service list row

## 4. Admin Services Page — Image Upload

- [x] 4.1 Remove the free-text `image_url` input from the service create/edit form
- [x] 4.2 Add a file input (accept `image/*`) labeled "Subir imagen" to the form
- [x] 4.3 On file selection, upload the file to `services/{serviceId}.{ext}` via `uploadMediaFile()` and update `image_url` in form state with the returned public URL
- [x] 4.4 Show a loading indicator on the file input area while upload is in progress; disable form submission during upload
- [x] 4.5 Show a thumbnail preview of the current image (or placeholder icon) in the form
- [x] 4.6 Add an "Eliminar imagen" button that calls `deleteMediaFile()` on the `services/` path and clears `image_url` in form state
- [x] 4.7 Show a Spanish error toast/message if the upload or delete fails; preserve the previous `image_url` on failure
- [x] 4.8 Handle the create-then-upload flow: image upload is only available after the service is created (edit mode) — show a hint on new-service form if applicable

## 5. Booking Page — Service Card Grid

- [x] 5.1 Fetch `getLandingConfig()` in `BookingPage` on mount (parallel with `useActiveServices()`) and store `primary_color` in local state
- [x] 5.2 Replace the plain `<ul>` / list in BookingPage Step 1 with a CSS grid container (`grid-cols-2 md:grid-cols-3 gap-4`)
- [x] 5.3 Implement a `ServiceCard` component (inline or in its own file) that accepts `service`, `selected`, `primaryColor`, and `onClick` props
- [x] 5.4 Render the service image in the card's image area; show a colored placeholder (`primary_color` or `#f3e8ff` fallback) when `image_url` is null or image fails to load
- [x] 5.5 Display service name, ARS-formatted price, and duration in the card body
- [x] 5.6 Truncate `description` to ~80 characters in the card (CSS line-clamp or JS slice)
- [x] 5.7 Apply hover state styles (border highlight or shadow lift) on card
- [x] 5.8 Apply selected state styles (colored border, checkmark) on card; only one card selected at a time
- [x] 5.9 Render loading skeleton cards (same grid layout) while `useActiveServices()` is loading
- [x] 5.10 Render a Spanish empty state message when no active services are returned

## 6. Booking Page — Service Detail Panel

- [x] 6.1 Add `panelService: Service | null` state to BookingPage Step 1 to track which service's detail panel is open
- [x] 6.2 Implement a `ServiceDetailPanel` component (inline or in its own file) with `service`, `isOpen`, `onClose`, `onSelect` props
- [x] 6.3 On card click: if service has a non-empty `description`, set `panelService` to open the panel; otherwise select the service directly
- [x] 6.4 Render the panel as a bottom drawer (slide-up) on mobile (`< 768px`) and a side panel on desktop
- [x] 6.5 Panel content: service image (or placeholder), name, price, duration, full description text
- [x] 6.6 "Seleccionar este servicio" CTA button in the panel sets the selected service in booking state and closes the panel
- [x] 6.7 Backdrop tap (mobile) and close button dismiss the panel without changing booking state
- [x] 6.8 Ensure panel is accessible (focus trap, keyboard dismiss with Escape, ARIA role dialog)

## 7. Tests

- [x] 7.1 Unit test: `adminListServices()` mapper includes `description` field
- [x] 7.2 Unit test: `adminCreateService()` / `adminUpdateService()` pass `description` to RPC
- [x] 7.3 Component test: `ServiceCard` renders image, name, price, duration, and truncated description
- [x] 7.4 Component test: `ServiceCard` shows placeholder when `image_url` is null
- [x] 7.5 Component test: `ServiceCard` applies selected styles when `selected=true`
- [x] 7.6 Component test: `ServiceDetailPanel` opens when a card with description is clicked
- [x] 7.7 Component test: `ServiceDetailPanel` "Seleccionar este servicio" calls `onSelect` and `onClose`
- [x] 7.8 Component test: BookingPage Step 1 renders loading skeleton while fetching
- [x] 7.9 Component test: BookingPage Step 1 renders Spanish empty state when no services
- [x] 7.10 Component test: admin service form shows description textarea and file upload; no image_url text input
