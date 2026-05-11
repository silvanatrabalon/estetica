## ADDED Requirements

### Requirement: Canonical Application Roles
The system SHALL define a canonical application role model with exactly three supported roles: `customer`, `staff`, and `admin`. Role identifiers MUST be stored in a normalized and queryable PostgreSQL structure suitable for use in authorization logic.

#### Scenario: Role model is initialized
- **WHEN** the role model migration is applied
- **THEN** the database contains canonical role values for `customer`, `staff`, and `admin`

#### Scenario: Unsupported role assignment is rejected
- **WHEN** a write attempts to assign a role outside the canonical role model
- **THEN** the database rejects the write and persists no invalid role value

### Requirement: Role Assignment Source of Truth
The system SHALL maintain a single source of truth that maps each authenticated user to an effective application role. Authorization checks MUST resolve role data from this source of truth rather than from client-provided values.

#### Scenario: Authenticated user has role mapping
- **WHEN** an authenticated user exists in the system
- **THEN** role resolution can determine an effective role for that user from the database source of truth

#### Scenario: Client role claims are ignored for authorization
- **WHEN** a client request includes a claimed role value that differs from stored role mapping
- **THEN** authorization decisions are made using stored role mapping, not the client claim

### Requirement: Least-Privilege Default Role
The system SHALL apply least privilege by assigning `customer` as the default effective role for newly onboarded authenticated users unless a privileged role is explicitly granted.

#### Scenario: New authenticated user is onboarded
- **WHEN** a user authenticates for the first time and no role mapping exists
- **THEN** the user receives `customer` as the effective role

#### Scenario: Privileged roles require explicit grant
- **WHEN** a user is expected to act as `staff` or `admin`
- **THEN** the role mapping reflects an explicit privileged-role assignment action
