## Why

The backlog item #9 is currently too broad to implement safely without scope drift and overlap with future phases (multi-tenant and audit logging). This change defines a strict MVP contract for admin user management so the team can deliver user directory, role control, and deactivation behavior with clear security and testing boundaries.

## What Changes

- Define an admin-only user management MVP centered on operational essentials.
- Add requirements for user directory states (loading, empty, success, recoverable error).
- Add requirements for global role assignment using canonical roles (`customer`, `staff`, `admin`).
- Add requirements for reversible user deactivation/reactivation with explicit confirmation.
- Add requirements for lightweight operational analytics with a constrained KPI set.
- Add safety constraints for high-risk actions (self-demotion and last-admin lockout protection).
- Keep all user-facing copy in Spanish for this capability.
- Explicitly defer advanced analytics, full audit logging platform, and org-scoped administration.

## Capabilities

### New Capabilities
- `admin-user-management-panel`: Admin-only user directory, role management, deactivation/reactivation lifecycle actions, and basic operational analytics for MVP.

### Modified Capabilities
- `role-model-and-user-roles`: Clarify admin role transition constraints and safety invariants for role updates from the admin panel.
- `supabase-rls-access-control`: Extend authorization expectations for admin-only user management mutations and denied non-admin paths.
- `user-profile-create-update`: Narrow overlap by keeping prior basic profile editing behavior as-is while moving advanced user management to this new capability.

## Impact

- Affected frontend area: admin users route and related role/action UX states.
- Affected backend/data area: role mutation policies, user lifecycle state handling, and admin-safe read models.
- Affected security/testing area: expanded RLS smoke coverage, admin/non-admin permission checks, and regression tests for route guards.
- No new external dependencies are required for proposal scope.
