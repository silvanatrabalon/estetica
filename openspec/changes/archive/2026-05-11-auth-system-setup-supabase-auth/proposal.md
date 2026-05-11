## Why

The project already has Supabase client bootstrap and hosted-project setup, but it still lacks an application authentication flow. We need Google-only sign-in through Supabase Auth now so upcoming route protection, profile creation, and authorization work can build on a consistent authenticated user context.

## What Changes

- Configure Supabase Auth for Google OAuth as the only supported sign-in method for the application.
- Add the application auth flow requirements for starting sign-in, handling the Supabase auth callback, and resolving the authenticated user state after redirect.
- Define secure frontend auth environment configuration and hosted-project URL requirements for local and production environments.
- Document the intended separation between authentication in this change and authorization/session-lifecycle work in follow-up features.

## Capabilities

### New Capabilities
- `google-authentication`: Establishes Google-only authentication with Supabase Auth, callback handling, and authenticated user initialization for the app.

### Modified Capabilities
- None.

## Impact

- Adds new OpenSpec artifacts for the app authentication flow.
- Affects frontend auth integration, Supabase hosted-project auth configuration, and setup documentation.
- Creates the dependency foundation for protected routes, user profile bootstrapping, and later RLS-aware application behavior.
- Does not introduce role logic, RLS policy design, email/password auth, or advanced session management beyond what is required for the initial auth flow.