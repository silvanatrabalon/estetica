## Why

The project currently supports login but does not define a complete session lifecycle after authentication, which creates ambiguity around token refresh failure, logout cleanup, and expired-session recovery. This change is needed now to make authentication behavior deterministic and secure before protected routes and broader app workflows are introduced.

## What Changes

- Define deterministic session restoration behavior during application bootstrap.
- Define token refresh handling for both success and failure paths.
- Define explicit logout behavior that signs out from Supabase and clears local auth-dependent application state.
- Define expired-session recovery behavior that resets auth state and returns the user to sign-in.
- Keep this change scoped to session lifecycle only, excluding route guards and role-based authorization.

## Capabilities

### New Capabilities
- `user-session-lifecycle-management`: Defines session restoration, refresh lifecycle behavior, logout semantics, and expired-session recovery for authenticated users.

### Modified Capabilities
- None.

## Impact

- Auth/session services in `src/services/` for lifecycle orchestration and user/session state transitions.
- Shared Supabase client integration in `src/lib/` where session restoration and auth change handling are centralized.
- UI-level auth state handling paths in app bootstrap and sign-in recovery flows.
- Test coverage for session restoration, refresh failure, logout cleanup, and expired-session behavior.
