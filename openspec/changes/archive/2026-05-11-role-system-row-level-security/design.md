## Context

The project currently has Supabase authentication in place but does not yet define an authorization model that can safely separate customer, staff, and admin operations. The repository architecture treats Supabase RLS as the primary authorization boundary, so role-driven access must be enforced in SQL policies before route-level guards and booking flows are introduced. This change must provide a reusable authorization foundation that supports incremental delivery without introducing product-specific coupling.

## Goals / Non-Goals

**Goals:**
- Define a canonical role model (`customer`, `staff`, `admin`) with a clear source of truth tied to authenticated users.
- Ensure role lookup is deterministic and can be consumed by SQL policies and frontend role-gated UX.
- Implement RLS policies that strictly separate public reads, authenticated customer actions, staff operational actions, and admin management actions.
- Keep authorization logic primarily in Supabase/PostgreSQL (platform-native) rather than custom backend middleware.
- Prepare for upcoming protected routes and booking workflows without requiring immediate implementation of those flows.

**Non-Goals:**
- Building complete frontend protected-route components in this change.
- Implementing full admin UI for role assignment and user management.
- Introducing custom REST services for authorization checks.
- Finalizing all future domain-table RLS rules beyond the foundational tables and patterns established here.

## Decisions

### Decision 1: Store application roles in a dedicated user role table keyed by auth user ID
- Rationale: Keeps role management explicit, queryable, and auditable in PostgreSQL while avoiding overloading auth metadata for authorization-critical state.
- Alternatives considered:
  - Store role only in auth metadata: rejected because policy access and auditability are weaker and mutation governance is harder.
  - Derive role indirectly from organization membership only: rejected for MVP because it adds complexity before tenant features are fully implemented.

### Decision 2: Provide a stable SQL helper for current user role resolution inside RLS policies
- Rationale: Centralizes role-resolution logic so individual policies remain readable and consistent, reducing policy drift.
- Alternatives considered:
  - Inline role subqueries in every policy: rejected due to duplication and higher maintenance risk.
  - Resolve roles in frontend only: rejected because frontend checks cannot replace database-enforced security.

### Decision 3: Default role assignment to `customer` on first authenticated access, with elevated roles granted via controlled admin/staff workflows
- Rationale: Aligns with least privilege and enables safe onboarding of users before operational privileges are explicitly assigned.
- Alternatives considered:
  - Require manual role assignment before any access: rejected as too operationally heavy for MVP.
  - Auto-assign `staff` for certain login providers: rejected because provider identity is not a trustworthy role indicator.

### Decision 4: Enforce deny-by-default policy posture for sensitive tables
- Rationale: Ensures no privileged data is exposed unless explicitly allowed by role-aware policies.
- Alternatives considered:
  - Permit authenticated-read-by-default and restrict only writes: rejected due to leakage risk for admin/business data.
  - Split privileged data into an external service layer: rejected because it bypasses Supabase-native authorization strategy.

## Risks / Trade-offs

- [Policy complexity increases as more tables are added] -> Mitigation: establish reusable policy patterns and helper SQL functions now, then apply consistently.
- [Incorrect role bootstrapping can lock out valid users or over-privilege accounts] -> Mitigation: define deterministic default role flow and include migration-safe backfill logic.
- [RLS debugging overhead during development] -> Mitigation: add clear policy naming conventions and test scenarios mapped to role/user contexts.
- [Future multi-tenant model may require policy expansion] -> Mitigation: design role checks to be composable with future organization scoping rather than hard-coded assumptions.

## Migration Plan

1. Create migration for role enum/table structures and indexes required for role lookup.
2. Add SQL helper function(s) for current-role checks used by policies.
3. Enable RLS on targeted tables and add baseline public/authenticated/staff/admin policies.
4. Backfill existing authenticated users to `customer` where necessary.
5. Validate policy behavior with role-specific test queries for select/insert/update/delete paths.
6. Deploy migration to staging, run smoke checks on auth flows, then deploy to production.

Rollback strategy:
- Revert to previous migration version if policy behavior blocks critical operations.
- Temporarily relax only non-sensitive read policies if needed during incident mitigation, while preserving deny-by-default on privileged writes.

## Open Questions

- Which exact existing tables in the current schema should be considered public-readable in MVP vs authenticated-only?
- Should staff role be globally scoped at first, or tied to business membership once multi-tenant structures are introduced?
- Do we want an explicit `is_active` or suspension flag in role assignments for fast deactivation at policy level?
- What is the preferred operational workflow for granting/revoking `staff` and `admin` before admin tooling exists?
