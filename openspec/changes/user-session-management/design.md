## Context

The repository already supports Google OAuth sign-in and initial authenticated-user recovery, but it does not yet define a robust session lifecycle contract after login. Without explicit handling for refresh failures, logout cleanup, and expired-session recovery, user state can become inconsistent across app reloads and navigation. This change must provide deterministic, frontend-safe session lifecycle behavior using Supabase-native auth capabilities while staying separate from route guards and role authorization.

## Goals / Non-Goals

**Goals:**
- Define deterministic session restoration behavior during app bootstrap.
- Define explicit behavior for token refresh success and refresh failure.
- Define secure logout flow that clears Supabase session and local auth-dependent state.
- Define expired-session handling that resets auth state and routes users to sign-in recovery.
- Keep the implementation aligned with existing Supabase client and auth service patterns.

**Non-Goals:**
- Implementing protected route guards.
- Implementing role-based authorization decisions.
- Adding server-side session middleware or custom auth APIs.
- Expanding to multi-provider auth or identity linking.

## Decisions

### Decision 1: Keep Supabase Auth as the sole source of truth for session state
- Rationale: Avoids divergent session models and preserves platform-native behavior for refresh and invalidation.
- Alternatives considered:
  - Mirror tokens in custom local storage model: rejected due to increased security risk and drift.
  - Add custom backend session broker: rejected as unnecessary complexity for MVP.

### Decision 2: Centralize session lifecycle transitions in auth service layer
- Rationale: Session state transitions should be handled consistently from one service boundary rather than duplicated in components.
- Alternatives considered:
  - Handle transitions directly in UI components: rejected due to duplication and inconsistent error handling.
  - Global state-first orchestration: deferred until broader app state requirements are established.

### Decision 3: Treat refresh failure as deterministic session expiration
- Rationale: On refresh errors, the app should explicitly clear auth state and move users to re-authentication to avoid ambiguous semi-authenticated states.
- Alternatives considered:
  - Silent retry loops: rejected because they can hide failure and degrade UX.
  - Keep stale user context after refresh error: rejected for security and correctness reasons.

### Decision 4: Define logout as a two-step contract (remote sign-out + local cleanup)
- Rationale: Ensures Supabase session is invalidated and frontend auth-dependent state is reliably reset.
- Alternatives considered:
  - Local-only logout: rejected because server-side session may remain valid.
  - Remote sign-out without local cleanup: rejected because stale UI/auth state can leak into the next session.

## Risks / Trade-offs

- [Transient network failures during refresh can force re-login] -> Mitigation: surface clear user-facing recovery state and optional retry affordance.
- [Race conditions between bootstrap session restore and auth state listener] -> Mitigation: define one initialization path with idempotent state updates.
- [Over-scoping into route guards] -> Mitigation: explicitly keep protected route logic out of this change and constrain tasks to session lifecycle.
- [Inconsistent cleanup across features] -> Mitigation: define a shared auth-dependent cleanup boundary now and reuse in later features.

## Migration Plan

1. Add session lifecycle primitives to auth/session services.
2. Wire deterministic bootstrap behavior for session restoration.
3. Implement refresh failure handling and expired-session recovery transitions.
4. Implement explicit logout flow with local cleanup and redirect behavior.
5. Add tests/scenarios for restore, refresh success/failure, logout, and expiration.
6. Update docs to reflect lifecycle contract and out-of-scope boundaries.

Rollback strategy:
- Revert service-level changes to previous auth behavior if regressions are found.
- Keep sign-in flow intact while disabling new expiration/recovery branches during rollback.

## Open Questions

- Should expired-session redirect target a dedicated recovery route or existing sign-in entry point?
- Which local state slices must be considered auth-dependent cleanup scope in current MVP UI?
- Do we need user-facing messaging tiers for transient refresh failures vs definitive expiration?
