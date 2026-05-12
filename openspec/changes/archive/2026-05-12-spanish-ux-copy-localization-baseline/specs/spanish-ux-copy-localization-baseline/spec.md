## ADDED Requirements

### Requirement: Spanish Default For End-User UI Copy
The system MUST present end-user application copy in Spanish by default across customer, staff, and admin interfaces.

#### Scenario: User navigates primary application routes
- **WHEN** an end user navigates any implemented route in the application
- **THEN** visible UI copy is shown in Spanish by default

### Requirement: Spanish Coverage For UI States
The system MUST provide Spanish copy for user-facing stateful feedback, including loading, empty, validation, warning, and error states.

#### Scenario: Loading and empty states are rendered
- **WHEN** the application renders loading or empty states in user-facing flows
- **THEN** the corresponding messages are displayed in Spanish

#### Scenario: Validation and error states are rendered
- **WHEN** a user triggers validation, warning, or error feedback in UI forms and guarded screens
- **THEN** the system displays those messages in Spanish

### Requirement: Lightweight Localization Baseline
The system MUST establish a lightweight localization baseline that reduces future reintroduction of English copy without requiring full multi-language infrastructure.

#### Scenario: Reused interface copy is implemented
- **WHEN** repeated user-facing labels or messages are used across multiple components
- **THEN** the implementation uses a shared copy strategy where practical to reduce language drift

#### Scenario: Internal implementation artifacts are updated
- **WHEN** developers update code, tests, migrations, or technical documentation during this capability
- **THEN** those internal artifacts MAY remain in English unless an explicit requirement states otherwise

### Requirement: Route-Level Fallback Copy In Spanish
The system MUST present route-level fallback and recovery copy in Spanish, including unauthorized, not-found, and session/role recovery flows.

#### Scenario: User reaches unauthorized or recovery screens
- **WHEN** an end user reaches route-level fallback or recovery experiences
- **THEN** the visible fallback instructions and actions are shown in Spanish
