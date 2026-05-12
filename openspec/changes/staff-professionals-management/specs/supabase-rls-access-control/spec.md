## MODIFIED Requirements

### Requirement: Role-Aware Privileged Access Control
The system SHALL enforce role-aware RLS rules so privileged operations are limited to users with appropriate `staff` or `admin` roles. Customer users MUST NOT perform privileged admin or staff operations. Admin user management mutations (role updates and deactivation/reactivation actions) MUST be admin-only operations denied for non-admin actors. Business settings mutations for singleton business identity, branding, weekly business hours, and closure exceptions MUST also be admin-only operations denied for non-admin actors. Staff member create, update, and active status mutations MUST be admin-only operations executed through RPC functions denied for non-admin actors.

#### Scenario: Customer user attempts staff/admin operation
- **WHEN** an authenticated user with effective role `customer` performs a privileged write operation
- **THEN** the operation is denied by RLS

#### Scenario: Staff user performs allowed operational action
- **WHEN** an authenticated user with effective role `staff` performs a staff-allowed action
- **THEN** the operation succeeds if all non-role constraints are satisfied

#### Scenario: Admin user performs admin-only action
- **WHEN** an authenticated user with effective role `admin` performs an admin-only action
- **THEN** the operation succeeds if all non-role constraints are satisfied

#### Scenario: Non-admin attempts admin user management mutation
- **WHEN** an authenticated actor without effective role `admin` attempts role management or deactivation/reactivation mutation
- **THEN** the operation is denied by RLS

#### Scenario: Non-admin attempts business settings mutation
- **WHEN** an authenticated actor without effective role `admin` attempts to create or update singleton business settings, weekly business hours, or closure exceptions
- **THEN** the operation is denied by RLS

#### Scenario: Non-admin attempts staff member mutation
- **WHEN** an authenticated actor without effective role `admin` calls an admin staff RPC function to create, update, or change the active status of a staff member
- **THEN** the operation is denied with a permission error

#### Scenario: Admin creates staff member via RPC
- **WHEN** an authenticated user with effective role `admin` calls the admin create staff member RPC function with a valid user and display name
- **THEN** the staff member record is created and the staff role is assigned to the linked user if not already set
