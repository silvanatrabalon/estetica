## ADDED Requirements

### Requirement: Google-Only Sign-In
The system SHALL support Google OAuth through Supabase Auth as the only interactive sign-in method for the application.

#### Scenario: User starts sign-in with Google
- **WHEN** an unauthenticated user chooses to sign in
- **THEN** the application starts a Supabase Auth Google OAuth flow rather than presenting email/password authentication

### Requirement: Supabase Auth Callback Completion
The system SHALL complete the application authentication flow through the Supabase Auth redirect callback and return the user to the application in an authenticated state when authentication succeeds.

#### Scenario: Google authentication succeeds
- **WHEN** Google redirects the user back through the configured Supabase Auth callback
- **THEN** the application resolves the authenticated session from Supabase and can identify the signed-in user after redirect

### Requirement: Authenticated User Initialization
The system MUST initialize the frontend authenticated user state from the Supabase client when the application loads after a successful sign-in.

#### Scenario: Authenticated user revisits the app after login
- **WHEN** the application loads with a valid Supabase-authenticated session already present
- **THEN** the frontend initializes using that authenticated user context without requiring a second login prompt

### Requirement: Secure Auth Environment Configuration
The system SHALL require explicit Supabase project and redirect URL configuration for local and deployed environments before Google sign-in is considered operational.

#### Scenario: Environment is configured for local development
- **WHEN** a developer sets up Google OAuth and Supabase Auth for localhost
- **THEN** the documented configuration includes the required Supabase project URL, anon key, site URL, and allowed redirect URLs for local sign-in

#### Scenario: Environment is configured for production
- **WHEN** the application is deployed to its production host
- **THEN** the documented configuration includes the production site URL and allowed redirect URLs needed for Google sign-in to complete successfully

### Requirement: Scope Isolation from Authorization and Advanced Session Management
This change MUST exclude role-based authorization rules, RLS policy behavior, and advanced session lifecycle features beyond the initial authenticated user restoration required for sign-in.

#### Scenario: Feature scope is reviewed
- **WHEN** this change is evaluated for completeness
- **THEN** it contains Google sign-in, callback handling, authenticated user initialization, and auth environment configuration only