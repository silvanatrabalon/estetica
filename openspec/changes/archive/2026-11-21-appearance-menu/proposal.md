## Why

"Negocio" mixed two different things: the rules that make the booking system work (time zone, hours, closures, booking policy, notifications) and the look of what customers see (logo, booking texts, colors). "Página pública" was a separate menu entry. The logo, the Identidad color and the booking title/subtitle were saved but no screen used them.

## What Changes

- New admin menu **Apariencia** (`/admin/appearance`) for everything the customer sees. It replaces the "Página pública" menu entry and has two tabs: **Marca y reservas** and **Página pública** (page content followed by the social networks).
- **Marca y reservas**: logo (upload or URL) and the booking screen title/subtitle, saved independently from business rules.
- The logo is shown in the top bar for all roles.
- The booking screen shows the configured title and subtitle, falling back to "Reservar turno" and "Elegí el servicio que querés reservar.".
- **Negocio** keeps only rules: its first tab is renamed **General** (name and time zone), plus Horarios, Cierres and Política.
- Removed from Negocio: logo, Identidad color and booking texts. The Identidad color is dropped from the UI because the only colors in use are the Página pública design colors.
- `/admin/settings/landing` redirects to `/admin/appearance`.
- Saving Negocio no longer writes branding columns, so it cannot overwrite what was set in Apariencia.

## Capabilities

### New Capabilities
- `appearance-settings`: the Apariencia menu, brand form, logo in the top bar, booking texts

### Modified Capabilities
- `business-settings-profile`: identity requirement narrowed to name and time zone
- `landing-config-admin`: navigation entry becomes Apariencia
- `landing-admin-ux-polish`: title and navigation label for the public page panel
- `landing-social-links`: editor lives in the Página pública tab of Apariencia

## User Flow

1. Admin opens **Apariencia** → **Marca y reservas**, uploads a logo, writes the booking title/subtitle and presses "Guardar marca".
2. The logo appears in the top bar; customers see the new texts when booking.
3. Page content and design are edited in the **Página pública** tab; social networks in the same tab, below the page content.
4. Rules (hours, closures, policy, notifications) stay in **Negocio**.

## Data Model

No schema change. Uses existing `organizations.logo_url`, `booking_header_text`, `booking_subtitle_text`. `organizations.brand_primary_color` is no longer edited or read.

## Acceptance Criteria

- The admin menu has "Apariencia" and no "Página pública" entry; only admins can open it.
- Saving the brand form writes only logo and the two texts; saving Negocio does not touch them.
- Booking title ≤ 80 and subtitle ≤ 160 characters; longer values are rejected before saving.
- Empty booking texts fall back to the defaults; a missing or broken logo shows nothing.
- The old `/admin/settings/landing` URL still works through a redirect.
