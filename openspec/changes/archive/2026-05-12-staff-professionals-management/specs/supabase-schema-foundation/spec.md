## MODIFIED Requirements

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
