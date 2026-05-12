## Context

Feature #9 expands the current admin users experience from basic profile edits into a true admin user management MVP. The current system already has canonical roles (`customer`, `staff`, `admin`), protected admin routing, and RLS foundations, but it lacks explicit product-level requirements for role transition safety, deactivation semantics, and bounded analytics outcomes.

Confirmed product decisions for this change:
- Include authenticated users even when they do not have profile rows.
- Role management is global-only for this scope (no organization membership roles).
- Block both self-demotion and last-admin lockout outcomes.
- Deactivation means global app access block and is reversible from admin workflows.
- MVP analytics KPIs: total users, active vs inactive, role distribution, and recent signups (last 30 days).

## Goals / Non-Goals

**Goals:**
- Define a clear and testable MVP contract for admin user management.
- Standardize admin panel behavior for directory states, role updates, and deactivation/reactivation.
- Enforce security invariants through DB-backed authorization (RLS source of truth).
- Keep user-facing admin copy in Spanish for this capability.
- Prevent overlap with future backlog items (multi-tenant, advanced analytics, full audit platform).

**Non-Goals:**
- Build advanced BI/reporting or custom dashboard engine.
- Implement full audit logging platform (deferred to backlog #33).
- Introduce organization-scoped admin management before multi-tenant foundation (#10+).
- Add bulk automation workflows.

## Decisions

1. Single-panel MVP at `/admin/users`
- Keep the user management experience centered on the existing admin users route to reduce navigation complexity and delivery risk.
- Alternatives considered:
  - New route set (`/admin/users/:id`, separate analytics page): deferred to avoid premature fragmentation.

2. Canonical user listing model includes users without profile rows
- The directory must represent all authenticated users relevant to administration, not just rows present in profile tables.
- Alternatives considered:
  - Profile-only listing: rejected because it hides legitimate accounts and weakens admin control.

3. Global role management only
- Manage only canonical app roles (`customer`, `staff`, `admin`) in this change.
- Alternatives considered:
  - Organization role management in same scope: rejected due to dependency on multi-tenant roadmap.

4. Safety invariants for critical role actions
- Admin workflows must block self-demotion and actions that would leave zero active admins.
- Alternatives considered:
  - Allow risky actions with warning only: rejected because recovery would be operationally expensive and fragile.

5. Reversible global deactivation lifecycle
- Deactivation is a global access control state for app behavior and must support reactivation.
- Alternatives considered:
  - Non-reversible or UI-only deactivation: rejected as either too risky or too weak for operational administration.

6. Bounded analytics KPIs
- Include only four operational KPIs for MVP: total users, active vs inactive, role distribution, and signups in last 30 days.
- Alternatives considered:
  - Broader analytics set: deferred to avoid overlap with future dashboard/reporting items.

## Risks / Trade-offs

- [Risk] Listing users without profiles may require additional data joins and null-safe UI handling.
  - Mitigation: define explicit projection contract and deterministic fallback display values.
- [Risk] Last-admin invariant introduces mutation edge cases under concurrent updates.
  - Mitigation: enforce invariant at backend authorization layer and validate with SQL/RLS tests.
- [Risk] Deactivation semantics may affect existing authenticated sessions in non-obvious ways.
  - Mitigation: specify deterministic behavior for post-deactivation requests and test denial paths.
- [Risk] Analytics queries can drift into dashboard complexity.
  - Mitigation: cap analytics to agreed KPI list and keep out-of-scope items explicit in spec.

## Migration Plan

1. Add/adjust requirement specs for new capability and related modified capabilities.
2. Implement backend authorization and lifecycle behavior with RLS-safe paths.
3. Implement frontend admin panel flows and Spanish feedback states.
4. Add/extend automated tests (unit, integration, SQL smoke/RLS).
5. Validate route guard coherence and regression for existing admin basic profile behavior.

Rollback strategy:
- Revert admin-user-management-panel implementation changes while preserving existing basic admin profile editing from the prior capability.

## Open Questions

- No blocking open product questions remain for MVP scope after confirmation of the five decisions above.
