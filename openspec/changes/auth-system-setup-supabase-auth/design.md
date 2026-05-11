## Context

The repository already initializes a Supabase client in the frontend and validates the hosted-project environment at bootstrap time, but it does not yet expose any user authentication flow. The next backlog items depend on an authenticated app user, while authorization rules and richer session lifecycle behavior are intentionally deferred to later features.

## Goals / Non-Goals

**Goals:**
- Add a Google-only authentication entry point using Supabase Auth.
- Define how the SPA starts sign-in, returns from the Supabase auth callback, and restores the authenticated user context in the client.
- Keep environment and redirect configuration explicit for localhost and deployed environments.
- Preserve a clean boundary between authentication, authorization, and advanced session management.

**Non-Goals:**
- Adding email/password, magic link, or any non-Google provider.
- Implementing role assignment, RLS policy behavior, or permission checks.
- Introducing custom backend auth brokers or server-managed token exchange.
- Expanding session management beyond the baseline client behavior required for initial sign-in and user restoration.

## Decisions

1. Use Supabase Auth as the application auth layer with Google as the identity provider
- Decision: The application will authenticate users through Supabase Auth's Google OAuth integration rather than handling Google OAuth directly in custom frontend or backend code.
- Rationale: This keeps the architecture aligned with the repository's BaaS-first approach and prepares the app for future RLS-aware flows that depend on Supabase-issued sessions.
- Alternative considered: Direct Google OAuth integration in the frontend.
- Why not: It adds unnecessary custom auth complexity and weakens the integration path with Supabase user/session semantics.

2. Keep the frontend flow SPA-native
- Decision: The frontend will initiate sign-in from the Supabase JS client, rely on Supabase callback handling, and resolve the post-redirect user state from the client when the app loads.
- Rationale: This is the simplest way to support local and hosted environments without adding a separate backend auth callback handler.
- Alternative considered: Custom callback endpoint or server middleware.
- Why not: The current architecture does not require a separate server component for authentication.

3. Limit provider scope to Google-only
- Decision: The initial auth change supports only Google sign-in.
- Rationale: This matches the product decision, keeps UI and configuration simpler, and avoids broadening the feature with unneeded provider paths.
- Alternative considered: Multiple providers or email/password in the same change.
- Why not: It expands scope and overlaps with product decisions that are already settled.

4. Treat redirect and environment configuration as part of the feature contract
- Decision: Localhost and deployed app URLs must be configured in Supabase Auth URL settings and documented as required setup.
- Rationale: OAuth flows fail in practice when redirect configuration is incomplete, so this is part of the functional design rather than optional documentation.
- Alternative considered: Leaving deployment URL setup as an implementation note only.
- Why not: It produces a partially working auth feature that breaks after deployment.

## Risks / Trade-offs

- [Risk] OAuth redirect mismatches between Google, Supabase, and Vercel can break sign-in despite correct frontend code.
  -> Mitigation: Make URL configuration a first-class requirement and document both local and production redirect settings.

- [Risk] Mixing auth concerns with session lifecycle work can cause the feature to balloon in scope.
  -> Mitigation: Limit this change to sign-in initiation, callback completion, and initial authenticated user restoration.

- [Risk] Future route guards may assume authorization data exists immediately after login.
  -> Mitigation: Keep this change focused on authenticated identity only and defer roles/permissions to the next backlog feature.

- [Risk] Supabase client defaults may obscure what session behavior is intentionally handled now versus later.
  -> Mitigation: Specify that only baseline client auth restoration is in scope here; advanced logout, expiry UX, and broader session flows remain for feature #5.