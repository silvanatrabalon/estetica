## Why

The public landing page showed only an Instagram link (editable) and a WhatsApp link hardcoded in the code. The business needs to choose which social networks appear in the public footer and manage their links without a code change.

## What Changes

- New `social_links` table: one row per (organization, network) with `value` and an `enabled` flag; public read of enabled rows, admin-only writes.
- Supported networks: Instagram, WhatsApp, Facebook, TikTok, YouTube, X, Sitio web.
- New "Redes sociales" section in **Página pública** (`/admin/settings/landing`) with a "Mostrar" check per network, its own form and save button.
- The landing footer renders the enabled networks (replaces the single Instagram link and the hardcoded WhatsApp link).
- WhatsApp is entered as a phone number; the link is built as `https://wa.me/<digits>`.
- The old Instagram field is removed from the landing config form. The Instagram URL already stored in `landing_config` is copied to `social_links` by the migration.
- The `landing_config.instagram_url` and `whatsapp_number` columns remain but are no longer read by the app.

## Capabilities

### New Capabilities
- `landing-social-links`: choose, store and show social network links on the public landing page

### Modified Capabilities
- `landing-footer-contact`: footer renders configured networks instead of fixed Instagram/WhatsApp links
- `public-landing-page`: footer social links come from configuration
- `landing-config-admin`: Instagram and WhatsApp fields leave the landing config form

## User Flow

1. Admin opens Página pública → "Redes sociales".
2. For each network: types the link (or WhatsApp number) and ticks or unticks "Mostrar".
3. Presses "Guardar redes". Empty values are removed; invalid values show an error and nothing is saved.
4. Visitors see icons only for ticked networks that have a value.

## Data Model

`public.social_links(organization_id uuid, network text, value text, enabled boolean, updated_at timestamptz)`, primary key `(organization_id, network)`; `network` restricted to the seven supported keys; `value` non-blank. RLS: select when `enabled` or admin; insert/update/delete admin only.

## Acceptance Criteria

- Only networks with `enabled = true` and a valid value appear in the footer, in a fixed order.
- Anonymous visitors can read enabled links and cannot write.
- Invalid URLs (non-http/https, no host) and WhatsApp numbers outside 8–15 digits are rejected before any write.
- URLs typed without a scheme get `https://`.
