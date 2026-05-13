## Purpose
Define Supabase Row Level Security expectations for public access separation, role-aware authorization, and deny-by-default enforcement.
## Requirements
### Requirement: Public vs Authenticated Data Separation
The system SHALL enforce RLS policies that explicitly separate unauthenticated public access from authenticated access. Tables containing sensitive or operational data MUST deny public access unless a policy explicitly permits it.

#### Scenario: Public request to sensitive table is denied
- **WHEN** an unauthenticated client queries a sensitive table
- **THEN** no rows are returned unless an explicit public-read policy exists for that table

#### Scenario: Public-readable table is accessible without authentication
- **WHEN** an unauthenticated client queries a table marked as public-readable
- **THEN** only data allowed by public-read policy is returned

### Requirement: Role-Aware Privileged Access Control
The system SHALL enforce role-aware RLS rules so privileged operations are limited to users with appropriate `staff` or `admin` roles. Customer users MUST NOT perform privileged admin or staff operations. Admin user management mutations (role updates and deactivation/reactivation actions) MUST be admin-only operations denied for non-admin actors. Business settings mutations for singleton business identity, branding, weekly business hours, and closure exceptions MUST also be admin-only operations denied for non-admin actors. Staff member create, update, and active status mutations MUST be admin-only operations executed through RPC functions denied for non-admin actors. Staff availability template and exception date mutations MUST be admin-only operations executed through SECURITY DEFINER RPC functions; direct table writes by non-admin actors MUST be denied.

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

#### Scenario: Non-admin attempts staff availability mutation
- **WHEN** an authenticated actor without effective role `admin` attempts a direct write on `staff_schedules` or `staff_schedule_exceptions`, or calls an admin availability RPC function
- **THEN** the operation is denied with a permission error

#### Scenario: Admin mutates staff availability via RPC
- **WHEN** an authenticated user with effective role `admin` calls an admin staff availability RPC function with valid parameters
- **THEN** the availability template or exception is persisted as expected

### Requirement: Deny-by-Default Policy Baseline
The system SHALL apply a deny-by-default authorization baseline for role-protected tables so that access is blocked unless explicitly granted by a policy.

#### Scenario: New role-protected table has no allow policy
- **WHEN** a query or mutation targets a role-protected table without a matching allow policy
- **THEN** the action is denied

#### Scenario: Explicit allow policy grants scoped access
- **WHEN** a matching RLS allow policy exists for the user context and operation
- **THEN** only the allowed rows and operations are accessible

