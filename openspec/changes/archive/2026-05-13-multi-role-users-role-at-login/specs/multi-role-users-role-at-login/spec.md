## ADDED Requirements

### Requirement: Multi-Role User Model
The system SHALL support assigning multiple canonical roles to a single user account. The `user_roles` table MUST use a composite primary key `(user_id, role)` so each role assignment is a separate row. A user with no explicit role assignment defaults to `customer` via a single insert at onboarding.

#### Scenario: User has single role assigned
- **WHEN** a user account has exactly one row in `user_roles`
- **THEN** role resolution returns that single role with no change to existing behavior

#### Scenario: User has multiple roles assigned
- **WHEN** a user account has more than one row in `user_roles`
- **THEN** role resolution returns all assigned roles for that user

#### Scenario: Duplicate role assignment is rejected
- **WHEN** an admin attempts to assign a role that is already assigned to a user
- **THEN** the operation is a no-op or returns the existing row without error

### Requirement: Admin Role Assignment and Revocation
The system SHALL allow admins to assign individual roles to users and revoke individual roles from users via SECURITY DEFINER RPC functions.

#### Scenario: Admin assigns a new role to a user
- **WHEN** an authenticated admin calls the assign role RPC with a valid user and role
- **THEN** a new role assignment row is inserted for that user and role

#### Scenario: Admin revokes a role from a user
- **WHEN** an authenticated admin calls the revoke role RPC with a valid user and role
- **THEN** the matching role assignment row is deleted

#### Scenario: Non-admin attempts role assignment
- **WHEN** an authenticated actor without the `admin` role calls the assign role RPC
- **THEN** the operation is denied with a permission error

#### Scenario: Last-admin lockout is enforced on revoke
- **WHEN** an admin attempts to revoke the `admin` role from the only remaining admin user
- **THEN** the operation is rejected and an error is returned

#### Scenario: Admin cannot self-demote by revoking their own admin role if sole admin
- **WHEN** the acting admin is the only user with the `admin` role and attempts to revoke their own `admin` role
- **THEN** the operation is rejected

### Requirement: RLS Helper Functions Support Multi-Row Role Table
The system SHALL update `is_admin()`, `is_staff_or_admin()`, and `current_app_role()` to correctly resolve role authorization from a multi-row `user_roles` table.

#### Scenario: is_admin() returns true for user with admin role
- **WHEN** `is_admin()` is called for a user who has an `admin` row in `user_roles`
- **THEN** the function returns `true`

#### Scenario: is_staff_or_admin() returns true for user with staff role only
- **WHEN** `is_staff_or_admin()` is called for a user who has a `staff` row but no `admin` row
- **THEN** the function returns `true`

#### Scenario: current_app_role() returns highest-privilege role
- **WHEN** `current_app_role()` is called for a user with multiple assigned roles
- **THEN** the function returns the highest-privilege role using precedence: `admin` > `staff` > `customer`

#### Scenario: get_user_roles() returns all assigned roles
- **WHEN** `get_user_roles()` is called for the authenticated user
- **THEN** the function returns an array of all `app_role` values assigned to that user

### Requirement: Role Selector at Login for Multi-Role Users
The system SHALL present a role selector screen after successful authentication when the user has more than one assigned role. Single-role users MUST bypass the selector and proceed directly to their role home.

#### Scenario: Single-role user bypasses selector
- **WHEN** a user with exactly one assigned role authenticates
- **THEN** the system navigates directly to the role home for that role without showing a selector

#### Scenario: Multi-role user sees role selector
- **WHEN** a user with multiple assigned roles authenticates
- **THEN** the system presents a role selector screen with a card for each assigned role before entering the app

#### Scenario: User selects a role from the selector
- **WHEN** a multi-role user chooses a role on the selector screen
- **THEN** the system sets that role as the active role and navigates to the corresponding role home

### Requirement: Mid-Session Active Role Switch
The system SHALL allow users with multiple roles to switch their active role mid-session without signing out.

#### Scenario: "Cambiar modo" entry visible for multi-role users
- **WHEN** a user with multiple assigned roles views the user menu
- **THEN** a "Cambiar modo" option is visible in the menu

#### Scenario: "Cambiar modo" entry hidden for single-role users
- **WHEN** a user with exactly one assigned role views the user menu
- **THEN** the "Cambiar modo" option is not visible

#### Scenario: User switches active role mid-session
- **WHEN** a multi-role user selects a different role via "Cambiar modo"
- **THEN** the active role is updated in context and the user is redirected to the role home for the new active role

### Requirement: Active Role is Session-Scoped Only
The system SHALL store the active role selection in frontend session context only. Active role MUST NOT be persisted to the database. Active role MUST reset on sign-out.

#### Scenario: Active role resets on sign-out
- **WHEN** a user signs out
- **THEN** the active role is cleared along with all auth-dependent state

#### Scenario: RLS enforces all assigned roles regardless of active role
- **WHEN** a user with `admin` + `staff` roles has `staff` set as active role
- **THEN** admin-only RPC functions remain callable because RLS checks the DB role assignment, not the UI active role

### Requirement: Admin Users Panel Multi-Role Display
The system SHALL update the Admin Users panel to display all assigned roles per user and allow assigning or revoking individual roles via checkboxes.

#### Scenario: Admin Users panel shows all assigned roles per user
- **WHEN** an admin views the user directory
- **THEN** each user row displays all their currently assigned roles

#### Scenario: Admin assigns a second role via checkbox
- **WHEN** an admin checks a role checkbox for a user who does not yet have that role
- **THEN** the system calls the assign role RPC and adds the role to the user

#### Scenario: Admin revokes a role via checkbox
- **WHEN** an admin unchecks a role checkbox for a user who has that role
- **THEN** the system calls the revoke role RPC and removes the role from the user

### Requirement: Spanish Copy for Role Selection UI
All user-visible copy in the role selector and "Cambiar modo" flow MUST be in Spanish.

#### Scenario: Role selector screen uses Spanish copy
- **WHEN** the role selector screen is displayed
- **THEN** all labels, headings, and call-to-action text are in Spanish

#### Scenario: Role switch confirmation uses Spanish copy
- **WHEN** a user switches their active role
- **THEN** any feedback or labels shown are in Spanish
