# Session Lifecycle Validation

This document defines executable validation scenarios for feature 5 (User Session Management).

## Scope
- Session restoration on app bootstrap
- Refresh success/failure behavior
- Logout cleanup behavior
- Expired-session recovery

Out of scope:
- Protected route guards
- Role-based authorization (RBAC)

## Manual Validation Scenarios

### 1. Bootstrap restoration with active session
1. Sign in with Google.
2. Reload the app.
3. Verify authenticated user context is restored without manual sign-in.

Expected result:
- App shows authenticated state after reload.

### 2. Bootstrap with no session
1. Ensure user is signed out.
2. Reload the app.

Expected result:
- App starts in unauthenticated state.
- No stale user data is shown.

### 3. Refresh success behavior
1. Sign in and keep app open.
2. Wait for normal token refresh cycle.

Expected result:
- Session remains authenticated.
- No forced sign-in prompt appears.

### 4. Refresh failure behavior
1. Simulate invalid refresh token or revoke session from Supabase dashboard.
2. Trigger session check (wait for health check or reload app).

Expected result:
- App clears auth-dependent state.
- App redirects to sign-in entry point.
- User sees expiration/recovery message.

### 5. Logout behavior
1. Sign in.
2. Click "Sign out".

Expected result:
- Supabase sign-out completes.
- Local auth-dependent state is reset.
- App remains in consistent unauthenticated state.

### 6. Scope verification
1. Inspect changed code for session feature implementation.

Expected result:
- No protected-route guard logic introduced.
- No RBAC/role authorization logic introduced.
