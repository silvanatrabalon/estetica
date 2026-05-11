# Authentication & Security

## Auth System
- Supabase Auth
- OAuth providers (Google, etc.)

## Security Model
- Row Level Security (RLS) is the main authorization layer
- Never trust frontend for permissions

## Rules
- No service keys in frontend
- Separate public vs private env vars
- Validate access at database level

## Session Lifecycle Contract
- Supabase Auth is the single source of truth for active session state.
- App bootstrap MUST restore session deterministically before rendering authenticated UI.
- Token refresh success keeps authenticated state.
- Token refresh failure is treated as session expiration and triggers auth-state cleanup + sign-in recovery.
- Logout is a two-step contract: Supabase sign-out followed by local auth-dependent state cleanup.

## Scope Boundaries
- Session lifecycle management does not implement protected-route guards.
- Session lifecycle management does not implement role-based authorization (RBAC).
- Authorization remains enforced by RLS and later dedicated route/authorization features.