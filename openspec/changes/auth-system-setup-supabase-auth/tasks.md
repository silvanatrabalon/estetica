## 1. Supabase Auth Configuration

- [x] 1.1 Verify the frontend Supabase client configuration supports Google OAuth initiation and authenticated user restoration at app startup.
- [x] 1.2 Document and align the required Supabase Auth provider, site URL, and redirect URL configuration for local and production environments.

## 2. Frontend Authentication Flow

- [x] 2.1 Add a Google sign-in entry point in the frontend that starts the Supabase Auth OAuth flow.
- [x] 2.2 Implement application-side auth callback handling so the SPA resolves the signed-in user after redirect.
- [x] 2.3 Initialize and expose authenticated user state from the Supabase client on application load.

## 3. Scope and Verification

- [x] 3.1 Ensure the change remains Google-only and does not introduce email/password, role logic, or advanced session lifecycle behavior.
- [x] 3.2 Validate the local and deployed sign-in flow against the documented redirect configuration and update project docs where needed.