## MODIFIED Requirements

### Requirement: Deterministic Session Restoration
The system SHALL restore authenticated session state deterministically during application bootstrap using Supabase Auth as the source of truth. Bootstrap MUST fetch all assigned roles for the user and expose them in context. If the user has multiple roles, bootstrap MUST route to the role selector before entering the app. If the user has a single role, bootstrap proceeds directly.

#### Scenario: Existing valid session on app load — single-role user
- **WHEN** the application initializes and Supabase has a valid session for a single-role user
- **THEN** the frontend restores authenticated user state and navigates to the role home without showing a selector

#### Scenario: Existing valid session on app load — multi-role user
- **WHEN** the application initializes and Supabase has a valid session for a user with multiple assigned roles
- **THEN** the frontend restores authenticated user state and routes to the role selector screen

#### Scenario: No active session on app load
- **WHEN** the application initializes and no Supabase session is present
- **THEN** the frontend initializes in unauthenticated state without stale user context or stale active role
