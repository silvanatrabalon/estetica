## ADDED Requirements

### Requirement: First Login Profile Bootstrap
The system MUST ensure a profile record exists for an authenticated user through a frontend upsert flow during first-login bootstrap.

#### Scenario: Authenticated user without profile
- **WHEN** an authenticated user session is restored and no profile record exists for that user
- **THEN** the client performs an idempotent upsert to create the profile record

#### Scenario: Authenticated user with existing profile
- **WHEN** an authenticated user session is restored and the profile record already exists
- **THEN** the bootstrap flow does not create duplicates and continues normally

### Requirement: Dedicated Profile Setup Route
The system MUST provide a dedicated setup route at `/profile/setup` for profile onboarding.

#### Scenario: User navigates to setup route
- **WHEN** an authenticated user accesses `/profile/setup`
- **THEN** the system shows the profile setup experience with name and phone fields

#### Scenario: Name prefill from Google profile
- **WHEN** the authenticated user has Google profile metadata containing a name
- **THEN** the setup form pre-fills the name field while allowing user edits

### Requirement: Soft-Gate Profile Completion
The system MUST implement soft-gate behavior for incomplete profiles.

#### Scenario: Incomplete profile detection
- **WHEN** an authenticated user profile does not satisfy completion criteria
- **THEN** the user can continue using the application and sees a warning with a CTA to complete profile setup

#### Scenario: Profile load failure
- **WHEN** profile retrieval fails during authenticated flow
- **THEN** the user can continue in the app and the UI shows a recoverable warning/CTA

### Requirement: Completion Criteria
The system MUST treat profile completion as satisfied when name is present.

#### Scenario: Name present
- **WHEN** the profile has a non-empty name
- **THEN** the profile is marked as complete

#### Scenario: Name missing
- **WHEN** the profile name is empty or missing
- **THEN** the profile is marked as incomplete regardless of phone value

### Requirement: Self-Service Profile Update
The system MUST allow authenticated users to view and update their own profile data.

#### Scenario: User updates own profile
- **WHEN** an authenticated user edits name and optional phone in profile UI and saves changes
- **THEN** the system persists the update for that same user profile

#### Scenario: Optional phone field
- **WHEN** an authenticated user submits profile data without phone
- **THEN** the system accepts the update if name is valid

### Requirement: Basic Admin Profile Editing
The system MUST provide basic admin profile editing limited to name and phone fields.

#### Scenario: Admin selects a user profile
- **WHEN** an admin accesses the basic admin profile editing interface
- **THEN** the system provides a simple list and selector to choose a user profile

#### Scenario: Admin edits basic fields
- **WHEN** an admin updates selected user name and/or phone
- **THEN** the system persists only allowed basic profile field updates

### Requirement: Explicit Scope Exclusions
The system MUST exclude advanced admin management and avatar workflows from this capability.

#### Scenario: Avatar workflow request
- **WHEN** a user attempts to use avatar upload or storage management within this capability
- **THEN** the system does not provide avatar upload/storage functionality in this change

#### Scenario: Advanced admin management request
- **WHEN** an admin workflow requires role changes, deactivation, or analytics
- **THEN** those actions are handled outside this capability and not implemented by this change

### Requirement: Test Coverage for Profile MVP
The system MUST include automated test coverage aligned with this capability scope.

#### Scenario: Frontend test coverage
- **WHEN** this capability is implemented
- **THEN** unit and integration tests cover setup flow, self-update flow, and basic admin edit flow

#### Scenario: SQL smoke coverage
- **WHEN** this capability is implemented
- **THEN** minimum SQL smoke tests validate profile ownership and first-login profile path behavior
