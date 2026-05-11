## 1. Session Lifecycle Foundation

- [x] 1.1 Add a session lifecycle module in auth services that defines deterministic bootstrap, refresh outcome, logout, and expiration transitions.
- [x] 1.2 Ensure session restoration at app initialization uses Supabase Auth session as the single source of truth.
- [x] 1.3 Add explicit state-reset helpers for auth-dependent local data cleanup.

## 2. Refresh and Expiration Handling

- [x] 2.1 Implement explicit token refresh success handling that preserves authenticated state.
- [x] 2.2 Implement explicit token refresh failure handling that marks the session expired and clears auth-dependent state.
- [x] 2.3 Wire expired-session recovery flow to redirect users to the sign-in entry point after cleanup.

## 3. Logout and UX Consistency

- [x] 3.1 Implement logout as Supabase sign-out plus deterministic local cleanup.
- [x] 3.2 Ensure logout completion always leaves the application in consistent unauthenticated state.
- [x] 3.3 Add user-facing error/recovery messaging paths for session expiration and refresh failures.

## 4. Validation and Scope Enforcement

- [x] 4.1 Add tests/scenarios for bootstrap restoration, refresh success/failure, logout cleanup, and expiration recovery.
- [x] 4.2 Verify no protected route guard or RBAC behavior is introduced by this change.
- [x] 4.3 Update documentation for session lifecycle contract, recovery behavior, and implementation boundaries.
