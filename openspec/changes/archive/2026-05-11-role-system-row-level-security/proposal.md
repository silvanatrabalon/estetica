## Why

The project now has authentication but no role-based authorization model, which creates risk of exposing admin-only data and blocks implementation of protected route behavior. This change is needed now to establish a secure foundation for booking and admin workflows before additional product features are built.

## What Changes

- Introduce a canonical role model with three application roles: `customer`, `staff`, and `admin`.
- Define where role assignment is stored and how authenticated users resolve their effective role.
- Add Supabase Row Level Security (RLS) policies that separate access across public, authenticated customer, staff, and admin contexts.
- Enforce admin-only and staff/admin-only data operations at the database policy layer.
- Provide authorization foundations that protected routes and authenticated booking flows can rely on in upcoming changes.

## Capabilities

### New Capabilities
- `role-model-and-user-roles`: Defines the application role model, role assignment source of truth, and role resolution behavior for authenticated users.
- `supabase-rls-access-control`: Defines RLS-based authorization behavior for public vs authenticated access and privileged (`staff`/`admin`) operations.

### Modified Capabilities
- None.

## Impact

- Database schema and migrations in `supabase/migrations/` for role storage and role-aware access helpers.
- RLS policy definitions for role-protected tables and operations.
- Supabase-facing auth/session services in `src/services/` and shared client wiring in `src/lib/` to support role-aware access patterns.
- Future route protection and booking authorization flows that depend on this role and policy foundation.
