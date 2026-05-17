## ADDED Requirements

### Requirement: Supabase Storage media bucket exists with correct access policies
The system SHALL have a Supabase Storage bucket named `media` configured with public read access (unauthenticated GET allowed) and admin-only write access. Storage RLS policies MUST enforce: any user (including anon) may read any object; only authenticated users with the `admin` role (verified via `user_roles` lookup) may INSERT, UPDATE, or DELETE objects.

#### Scenario: Unauthenticated user reads a media file
- **WHEN** an unauthenticated request is made to the public URL of a file in the `media` bucket
- **THEN** the file is served successfully with HTTP 200

#### Scenario: Admin user uploads a file
- **WHEN** an authenticated admin calls `supabase.storage.from('media').upload(path, file)`
- **THEN** the upload succeeds and the file is available at the public URL

#### Scenario: Non-admin authenticated user attempts to upload
- **WHEN** an authenticated user without the `admin` role attempts to upload to the `media` bucket
- **THEN** the upload is rejected with a Storage authorization error

#### Scenario: Unauthenticated user attempts to upload
- **WHEN** an unauthenticated caller attempts to upload to the `media` bucket
- **THEN** the upload is rejected with a Storage authorization error

---

### Requirement: landing_config table stores per-organization landing settings
The system SHALL maintain a `landing_config` table in PostgreSQL with the following columns: `id uuid PRIMARY KEY`, `organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id)`, `hero_title text`, `hero_subtitle text`, `about_text text`, `instagram_url text`, `whatsapp_number text`, `primary_color text DEFAULT '#f9a8d4'`, `secondary_color text DEFAULT '#fbcfe8'`, `font_family text DEFAULT 'Inter'`, `show_hours boolean DEFAULT true`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`. RLS MUST allow: anon/authenticated SELECT (read-only via RPC, not direct table access), admin INSERT/UPDATE.

#### Scenario: landing_config row can be upserted by admin RPC
- **WHEN** `admin_upsert_landing_config()` is called with valid field values
- **THEN** a row is inserted or updated in `landing_config` for the organization

#### Scenario: landing_config row is readable via public RPC
- **WHEN** `get_landing_config()` is called by an anon caller
- **THEN** the function returns the landing config fields for the organization

---

### Requirement: landing_carousel_images table stores ordered carousel image references
The system SHALL maintain a `landing_carousel_images` table with columns: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`, `organization_id uuid NOT NULL REFERENCES organizations(id)`, `storage_path text NOT NULL`, `alt_text text`, `display_order integer NOT NULL DEFAULT 0`, `created_at timestamptz DEFAULT now()`. RLS MUST allow: anon/authenticated SELECT (via RPC), admin INSERT/UPDATE/DELETE.

#### Scenario: Admin can add carousel image via RPC
- **WHEN** `admin_add_carousel_image(p_storage_path, p_alt_text)` is called
- **THEN** a row is inserted into `landing_carousel_images` with the next available `display_order`

#### Scenario: Admin can remove carousel image via RPC
- **WHEN** `admin_remove_carousel_image(p_image_id)` is called
- **THEN** the corresponding row is deleted from `landing_carousel_images`

#### Scenario: Admin can reorder carousel images via RPC
- **WHEN** `admin_reorder_carousel_images(p_ordered_ids uuid[])` is called
- **THEN** each image's `display_order` is updated to match its position in the array

---

### Requirement: get_landing_config RPC returns landing config to anon callers
The system SHALL provide a `get_landing_config()` SECURITY DEFINER PostgreSQL function granted to the `anon` and `authenticated` roles. The function MUST return a single row with all `landing_config` fields plus the ordered list of `landing_carousel_images` as a JSON array. When no `landing_config` row exists, the function MUST return a row with all fields as null.

#### Scenario: RPC returns config when row exists
- **WHEN** `get_landing_config()` is called and a `landing_config` row exists for the organization
- **THEN** all config fields and carousel images are returned

#### Scenario: RPC returns nulls when no config exists
- **WHEN** `get_landing_config()` is called and no `landing_config` row exists
- **THEN** a row with all null fields and an empty carousel array is returned

---

### Requirement: Admin landing config RPCs enforce admin-only access
The system SHALL provide the following SECURITY DEFINER PostgreSQL functions, each granted only to the `authenticated` role, and each MUST raise a named error `LANDING_NOT_AUTHORIZED` when called by a non-admin user:
- `admin_get_landing_config()` — returns full config including all fields
- `admin_upsert_landing_config(p_hero_title, p_hero_subtitle, p_about_text, p_instagram_url, p_whatsapp_number, p_primary_color, p_secondary_color, p_font_family, p_show_hours)` — upserts the config row
- `admin_add_carousel_image(p_storage_path text, p_alt_text text)` — inserts a carousel image row
- `admin_remove_carousel_image(p_image_id uuid)` — deletes a carousel image row
- `admin_reorder_carousel_images(p_ordered_ids uuid[])` — updates display_order for all images

#### Scenario: Admin calls admin_get_landing_config successfully
- **WHEN** an authenticated admin calls `admin_get_landing_config()`
- **THEN** the full landing config is returned

#### Scenario: Non-admin call raises LANDING_NOT_AUTHORIZED
- **WHEN** an authenticated non-admin user calls any admin landing RPC
- **THEN** the function raises `LANDING_NOT_AUTHORIZED`

#### Scenario: admin_upsert_landing_config creates row when none exists
- **WHEN** `admin_upsert_landing_config()` is called and no `landing_config` row exists
- **THEN** a new row is created with the provided values

#### Scenario: admin_upsert_landing_config updates existing row
- **WHEN** `admin_upsert_landing_config()` is called and a `landing_config` row already exists
- **THEN** the existing row is updated with the new values

---

### Requirement: TypeScript service layer exposes landing config functions
The system SHALL provide `src/services/landing.ts` with a `getLandingConfig()` function that calls `get_landing_config()` via the Supabase client and returns a typed `LandingConfig` object (with carousel images array). The system SHALL provide `src/services/adminLanding.ts` with typed functions for each admin RPC: `adminGetLandingConfig()`, `adminUpsertLandingConfig(data)`, `adminAddCarouselImage(storagePath, altText)`, `adminRemoveCarouselImage(imageId)`, `adminReorderCarouselImages(orderedIds)`. The system SHALL provide `src/services/adminLanding.ts` with `uploadMediaFile(bucket, path, file)` and `deleteMediaFile(bucket, path)` Storage helper functions.

#### Scenario: getLandingConfig returns typed config
- **WHEN** `getLandingConfig()` is called
- **THEN** it calls `get_landing_config()` and returns a `LandingConfig` typed object

#### Scenario: adminUpsertLandingConfig calls the correct RPC
- **WHEN** `adminUpsertLandingConfig(data)` is called
- **THEN** it calls `admin_upsert_landing_config` with all config fields

#### Scenario: uploadMediaFile uploads to the media bucket
- **WHEN** `uploadMediaFile('media', 'carousel/uuid.jpg', file)` is called
- **THEN** it calls `supabase.storage.from('media').upload('carousel/uuid.jpg', file)` and returns the public URL
