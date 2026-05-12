## Context

The application already has authenticated routing, role-based shells, and a placeholder profile page. Backlog item #8 now requires a concrete MVP profile flow with clear boundaries: frontend upsert bootstrap on first login, soft-gate setup, self-service update form, and limited admin profile editing. Existing architecture favors SPA-first and Supabase-native access control, so this design keeps profile flows inside current frontend + Supabase patterns without introducing custom backend APIs.

## Goals / Non-Goals

**Goals:**
- Ensure an authenticated user has a profile row through frontend bootstrap upsert.
- Provide a dedicated setup route at `/profile/setup` for profile completion.
- Enforce soft-gate behavior with warning/CTA instead of hard blocking.
- Implement self profile read/update for `name` (required) and `phone` (optional).
- Allow basic admin profile edit via simple list + selector (name/phone only).
- Preserve RLS as the primary authorization layer and validate with minimum SQL smoke tests.
- Cover behavior with unit and integration tests in frontend.

**Non-Goals:**
- Avatar upload/storage or avatar URL management.
- Admin analytics, deactivation, or role management.
- New REST API or edge function for profile CRUD.
- Hard-gate onboarding that blocks app usage until completion.

## Decisions

1. Bootstrap strategy: frontend upsert on authenticated session start.
- Rationale: aligns with product decision and avoids schema-trigger changes in this change.
- Alternative considered: DB trigger provisioning on `auth.users` insert. Rejected for this iteration because product chose client-side control and incremental rollout.

2. Profile completion model: soft gate with dedicated setup route.
- Rationale: user experience remains uninterrupted while still guiding completion.
- Alternative considered: hard gate with enforced redirects. Rejected due to product preference.

3. Completion criteria: `name` only.
- Rationale: matches decision to derive initial value from Google profile and keep MVP narrow.
- Alternative considered: requiring both name and phone. Rejected to reduce friction and scope.

4. Data scope for #8: `name` required, `phone` optional, no avatar.
- Rationale: keeps profile MVP focused and testable while avoiding storage workflow complexity.
- Alternative considered: include avatar management. Rejected as out of scope.

5. Admin support scope: basic profile edit only.
- Rationale: enables immediate operational support while limiting overlap with future admin management feature.
- Alternative considered: full user-management-level admin tooling. Rejected as out of scope for this change.

6. Error handling: allow app continuation on profile-load failure with warning + CTA.
- Rationale: consistent with soft-gate behavior and resilient UX.
- Alternative considered: blocking error screen. Rejected per product decision.

## Risks / Trade-offs

- [Client-side bootstrap can miss edge sessions or race with navigation] -> Mitigation: make upsert idempotent, trigger it in deterministic authenticated bootstrap path, and cover with integration tests.
- [Scope overlap with future admin user management] -> Mitigation: explicitly limit admin capability to basic edit of name/phone only and document non-goals.
- [Without broad DB test coverage, authorization regressions may go unnoticed] -> Mitigation: add minimum SQL smoke coverage for ownership and first-login path now; expand in future admin/security changes.
- [Soft gate may reduce completion rates] -> Mitigation: include visible reminder/CTA and dedicated setup route accessible from user navigation.

## Migration Plan

1. Add OpenSpec artifacts and approve scope.
2. Implement frontend profile service and setup/profile pages.
3. Add basic admin profile edit UI flow.
4. Add/adjust unit + integration tests.
5. Add minimum SQL smoke test coverage for profile ownership/first-login path.
6. Validate acceptance criteria and mark backlog item progress.

## Open Questions

- None blocking for this change. Any future expansion (avatar, full admin management, analytics) will be handled in separate backlog items.
