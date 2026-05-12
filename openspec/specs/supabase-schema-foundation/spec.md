## ADDED Requirements

### Requirement: Supabase Hosted Schema Workflow
The system MUST provide a deterministic Supabase hosted-project workflow for connecting through environment variables and applying database schema changes through versioned migrations.

#### Scenario: Hosted environment is configured for schema work
- **WHEN** a developer follows the documented setup for Supabase database development
- **THEN** the developer can connect the app to the hosted Supabase project through environment variables and apply schema migrations without undocumented manual steps

### Requirement: Versioned Schema Migrations
The system SHALL manage all PostgreSQL schema evolution through ordered, versioned migration files.

#### Scenario: New schema change is introduced
- **WHEN** a schema change is required
- **THEN** the change is implemented through a new versioned migration file rather than manual dashboard edits

### Requirement: Foundation Relational Schema
The system SHALL define an MVP-ready foundation relational schema with explicit primary keys, foreign keys, and integrity constraints. The schema MUST support canonical single-business persistence for the salon, including organization-backed business identity, weekly business hours, and business closure exceptions. Admin-accessible RPC functions MUST be defined for staff member management operations (list, create, update, set active status) including auto-assignment of the `staff` role on staff member creation.

#### Scenario: Foundation schema is created
- **WHEN** foundation migrations are applied
- **THEN** the resulting schema includes explicit table relations and constraints that enforce referential integrity

#### Scenario: Business operational calendar schema is created
- **WHEN** business-settings schema changes are applied
- **THEN** the resulting schema includes normalized persistence for singleton business identity, weekly business hours, and full-day or half-day business closure exceptions with integrity constraints suitable for later scheduling features

#### Scenario: Admin staff RPC functions are created
- **WHEN** staff-professionals-management schema changes are applied
- **THEN** the resulting schema includes admin-only SECURITY DEFINER RPC functions for listing staff members joined with profile and user role data, creating a staff member with auto role assignment, updating a staff member's display name, and setting a staff member's active status

### Requirement: Initial Index Strategy
The system MUST include an initial set of indexes based on expected MVP query patterns and uniqueness guarantees.

#### Scenario: Query paths require indexed access
- **WHEN** common MVP read patterns are executed against foundation entities
- **THEN** appropriate indexes exist to support efficient filtering and sorting on those paths

### Requirement: Scope Isolation from Auth and Full RLS
This change MUST exclude authentication flow implementation and full business-specific RLS policy design while keeping the schema prepared for later authorization work.

#### Scenario: Feature boundaries are validated
- **WHEN** this change is reviewed for completion
- **THEN** it contains schema, migration, index work, and baseline security hardening only, without implementing auth flows or complete business-specific RLS policy rules

### Requirement: Baseline Security for Exposed Tables
The system MUST apply baseline security controls for application tables exposed through Supabase APIs.

#### Scenario: Foundation tables are created
- **WHEN** foundation migrations create application tables in exposed schemas
- **THEN** Row Level Security is enabled on those tables and access for `anon` and `authenticated` remains denied by default until business-specific policies are introduced

### Requirement: Migration Verification Guidance
The system SHALL document verification steps that confirm migrations were applied correctly, schema objects exist as expected, and baseline security controls are active.

#### Scenario: Migration verification is performed
- **WHEN** a developer completes migration execution in a target environment
- **THEN** the documented verification steps confirm that required tables, constraints, and indexes are present, RLS is enabled on exposed tables, and no unintended access is granted to `anon` or `authenticated`
