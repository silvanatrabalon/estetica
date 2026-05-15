## Why

The business needs a catalog of services (e.g., corte de cabello, consulta, manicura) before any booking flow can exist. Without a managed service catalog, admins have no way to define what the business offers, how long each service takes, or how much it costs. This is a hard prerequisite for appointment booking (#16).

## What Changes

- Add `image_url text` nullable column to the existing `services` table (schema already has name, duration_minutes, price_cents, is_active)
- Add RLS policies for `services`: admin writes via RPCs, authenticated users can SELECT active services
- Add admin-only SECURITY DEFINER RPC functions for service CRUD: list, create, update, deactivate/reactivate
- Implement `src/services/adminServices.ts` TypeScript service layer
- Replace the `AdminServicesPage.tsx` placeholder with a full CRUD admin panel
- All user-facing copy in Spanish; price displayed in ARS (hardcoded), zero shown as `$0.00`

## Capabilities

### New Capabilities

- `services-catalog-admin`: Admin CRUD for the service catalog. Covers the `image_url` schema addition, RLS policies, admin RPC functions, TypeScript service layer, and the `AdminServicesPage` implementation.

### Modified Capabilities

*(none — existing capabilities are unaffected)*

## Impact

- `supabase/migrations/`: two new migration files (`_tables_grants_rls` and `_admin_rpc`)
- `src/services/adminServices.ts`: new file
- `src/pages/AdminServicesPage.tsx`: rewritten from placeholder to full implementation
- `src/lib/uiCopy.ts`: add service-related Spanish copy constants if missing
- No changes to routing, navigation, or existing RLS policies — services route and nav entry already exist
