## MODIFIED Requirements

### Requirement: Role Assignment Source of Truth
The system SHALL maintain a single source of truth that maps each authenticated user to an effective application role. Authorization checks MUST resolve role data from this source of truth rather than from client-provided values. Admin-initiated role updates MUST preserve safety invariants that prevent self-demotion and last-admin lockout outcomes.

#### Scenario: Authenticated user has role mapping
- **WHEN** an authenticated user exists in the system
- **THEN** role resolution can determine an effective role for that user from the database source of truth

#### Scenario: Client role claims are ignored for authorization
- **WHEN** a client request includes a claimed role value that differs from stored role mapping
- **THEN** authorization decisions are made using stored role mapping, not the client claim

#### Scenario: Admin role update preserves safety invariants
- **WHEN** an admin operation attempts to update roles in a way that self-demotes the acting admin or leaves zero active admins
- **THEN** the role update is rejected and the previous valid role mapping remains effective
