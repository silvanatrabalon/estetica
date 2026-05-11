## Why

The project currently has authenticated shell navigation but no true SPA routing or route-level authorization enforcement. This gap allows inconsistent behavior between visible navigation and actual page access, and blocks a clean transition into role-specific product features.

This change is needed now because backlog item #7 is the architectural boundary between shell preparation and feature delivery for profile, admin, and scheduling workflows.

## What Changes

- Introduce SPA route protection with authentication and role-based UI route authorization.
- Define a central route access matrix for public, authenticated, and role-restricted paths.
- Add deterministic redirect behavior for unauthenticated and authenticated session states.
- Add explicit unauthorized and not-found route handling.
- Add placeholder route pages for mapped paths that are not yet implemented, so guard behavior is testable end-to-end.
- Add test coverage for route policy, guard behavior, and protected-route integration flows.

## Capabilities

### New Capabilities
- `protected-routes-and-role-guards`: Defines UI route guards, role-based route access control, redirect behavior, unauthorized handling, and route policy testing.

### Modified Capabilities
- None.

## Impact

- Affected frontend areas: app composition, routing layer, guard components, navigation interaction, and placeholder pages.
- Affected tests: route policy/redirect unit tests, guard unit tests, and router integration tests.
- New dependency impact: SPA router library for React.
- Security boundary remains unchanged: Supabase RLS remains the source of truth for data authorization.
