## MODIFIED Requirements

### Requirement: Role Assignment Source of Truth
The system SHALL maintain a source of truth that maps each authenticated user to one or more effective application roles, using a composite primary key `(user_id, role)`. A user MAY have multiple rows — one per assigned role. Authorization checks MUST resolve role data from this source of truth rather than from client-provided values. Admin-initiated role operations MUST preserve safety invariants that prevent self-demotion and last-admin lockout outcomes.

#### Scenario: Authenticated user has role mapping
- **WHEN** an authenticated user exists in the system
- **THEN** role resolution can determine one or more effective roles for that user from the database source of truth

#### Scenario: Client role claims are ignored for authorization
- **WHEN** a client request includes a claimed role value that differs from stored role mappings
- **THEN** authorization decisions are made using stored role mappings, not the client claim

#### Scenario: Admin role update preserves safety invariants
- **WHEN** an admin operation attempts to revoke a role in a way that self-demotes the acting admin or leaves zero active admins
- **THEN** the role revocation is rejected and the previous valid role mapping remains effective

#### Scenario: User with multiple roles has all roles queryable
- **WHEN** an admin assigns more than one role to a single user
- **THEN** the `user_roles` table contains one row per assigned role for that user

### Requirement: Least-Privilege Default Role
The system SHALL apply least privilege by assigning `customer` as the default effective role for newly onboarded authenticated users unless a privileged role is explicitly granted. The onboarding insert creates a single `customer` row — valid under the composite PK.

#### Scenario: New authenticated user is onboarded
- **WHEN** a user authenticates for the first time and no role mapping exists
- **THEN** the user receives `customer` as the effective role via a single row insert

#### Scenario: Privileged roles require explicit grant
- **WHEN** a user is expected to act as `staff` or `admin`
- **THEN** the role mapping reflects an explicit privileged-role assignment action via admin RPC
