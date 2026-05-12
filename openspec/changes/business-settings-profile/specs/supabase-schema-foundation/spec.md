## MODIFIED Requirements

### Requirement: Foundation Relational Schema
The system SHALL define an MVP-ready foundation relational schema with explicit primary keys, foreign keys, and integrity constraints. The schema MUST support canonical single-business persistence for the salon, including organization-backed business identity, weekly business hours, and business closure exceptions.

#### Scenario: Foundation schema is created
- **WHEN** foundation migrations are applied
- **THEN** the resulting schema includes explicit table relations and constraints that enforce referential integrity

#### Scenario: Business operational calendar schema is created
- **WHEN** business-settings schema changes are applied
- **THEN** the resulting schema includes normalized persistence for singleton business identity, weekly business hours, and full-day or half-day business closure exceptions with integrity constraints suitable for later scheduling features