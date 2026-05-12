## Why

The product now needs a canonical, admin-managed source of truth for the single salon's business identity and operating calendar so later booking, availability, and notification features do not rely on hardcoded defaults or incomplete setup assumptions. This is the right time to introduce it because the app already has admin routing and role controls, but it still lacks any real business configuration workflow and even the singleton organization bootstrap is undefined.

## What Changes

- Add an admin-only business settings capability for the single salon covering visible business identity, branding basics, canonical business timezone, weekly business hours, and closure exceptions.
- Persist business settings in Supabase as the canonical source of truth, including a guaranteed singleton business record when none exists yet.
- Introduce business closure exceptions that support both full-day and half-day closures without adding staff-specific scheduling.
- Add a readiness warning model for incomplete business configuration that informs admins without hard-blocking the app.
- Extend admin navigation and protected routing to expose the new business settings experience.

## Capabilities

### New Capabilities
- `business-settings-profile`: Admin-only configuration of the single business identity, timezone, weekly business hours, closure exceptions, branding basics, and readiness warning behavior.

### Modified Capabilities
- `protected-routes-and-role-guards`: Add admin-only route coverage for the business settings page within the existing guarded admin navigation model.
- `supabase-rls-access-control`: Define admin-only write access and scoped read access for singleton business settings, business hours, and closure exception records.
- `supabase-schema-foundation`: Extend the foundation schema to support canonical business settings persistence for the single-tenant salon, including singleton bootstrap expectations and operational calendar tables.

## Impact

- Affected database schema and migrations for single-business settings, hours, and closure exceptions.
- Affected admin frontend navigation, route registry, and a new admin settings surface.
- Affected readiness and downstream scheduling assumptions for future availability, booking, and notification features.
- Affected SQL smoke coverage and frontend integration coverage for admin-only access and persistence flows.