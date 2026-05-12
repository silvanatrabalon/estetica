## MODIFIED Requirements

### Requirement: Explicit Scope Exclusions
The system MUST exclude advanced admin management and avatar workflows from this capability.

#### Scenario: Avatar workflow request
- **WHEN** a user attempts to use avatar upload or storage management within this capability
- **THEN** the system does not provide avatar upload/storage functionality in this change

#### Scenario: Advanced admin management request
- **WHEN** an admin workflow requires role changes, deactivation, or analytics
- **THEN** those actions are handled by the `admin-user-management-panel` capability and not implemented by this change
