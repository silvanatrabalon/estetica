## ADDED Requirements

### Requirement: Admin can view assigned services per staff member
The system MUST allow an admin to view the list of services currently assigned to a specific staff member via the sub-route `/admin/staff/:staffId/services`.

#### Scenario: Admin opens staff service assignment panel with existing assignments
- **WHEN** an authenticated admin navigates to `/admin/staff/:staffId/services`
- **THEN** the system loads and displays all services currently assigned to that staff member, each with a "Quitar" action button

#### Scenario: Admin opens staff service assignment panel with no assignments
- **WHEN** an authenticated admin navigates to `/admin/staff/:staffId/services` and the staff member has no assigned services
- **THEN** the system displays an empty state message in Spanish indicating no services are assigned

#### Scenario: Loading state is displayed while fetching assignments
- **WHEN** an authenticated admin navigates to `/admin/staff/:staffId/services` and data is being fetched
- **THEN** the system displays a loading indicator in Spanish

#### Scenario: Error state is displayed when loading fails
- **WHEN** the RPC call to load assignments fails
- **THEN** the system displays an error message in Spanish

#### Scenario: Non-admin access is denied
- **WHEN** an authenticated non-admin user attempts to access the staff service assignment panel
- **THEN** the system denies access through existing route guard mechanisms

### Requirement: Admin can assign an active service to a staff member
The system MUST allow an admin to assign an active service (not yet assigned to the staff member) via a dropdown selector and an "Asignar" button.

#### Scenario: Admin assigns a service to a staff member
- **WHEN** an authenticated admin selects an active unassigned service from the dropdown and clicks "Asignar"
- **THEN** the system calls the admin RPC, inserts the junction row, and the service appears in the assigned list

#### Scenario: Dropdown shows only active unassigned services
- **WHEN** an admin opens the service selector dropdown
- **THEN** only active services not yet assigned to the staff member are shown

#### Scenario: Dropdown is empty when all active services are already assigned
- **WHEN** all active services are already assigned to the staff member
- **THEN** the system shows a message in Spanish indicating all available services are already assigned

#### Scenario: Assign action fails with RPC error
- **WHEN** the assign RPC call returns an error
- **THEN** the system displays a descriptive error message in Spanish and the assignment list is not modified

### Requirement: Admin can unassign a service from a staff member
The system MUST allow an admin to hard-delete a junction row by clicking "Quitar" on an assigned service row.

#### Scenario: Admin removes an assigned service
- **WHEN** an authenticated admin clicks "Quitar" on an assigned service row
- **THEN** the system calls the admin RPC, deletes the junction row, and the service is removed from the assigned list

#### Scenario: Unassign action fails with RPC error
- **WHEN** the unassign RPC call returns an error
- **THEN** the system displays a descriptive error message in Spanish and the assignment list is not modified

### Requirement: Staff service assignments are accessible to all authenticated roles via RLS
The system MUST allow any authenticated user (customer, staff, admin) to SELECT from `staff_services` via RLS, enabling the booking flow to filter eligible staff.

#### Scenario: Authenticated non-admin can read staff_services
- **WHEN** an authenticated non-admin user queries `staff_services` via the Supabase client
- **THEN** the query succeeds and returns rows matching the request

#### Scenario: Non-admin cannot directly INSERT or DELETE from staff_services
- **WHEN** an authenticated non-admin user attempts a direct INSERT or DELETE on `staff_services`
- **THEN** the operation is rejected by RLS

#### Scenario: Admin RPC succeeds for authorized admin
- **WHEN** an authenticated admin calls `admin_assign_service_to_staff` or `admin_unassign_service_from_staff`
- **THEN** the RPC executes successfully and modifies the junction table

#### Scenario: Admin RPC raises error for non-admin caller
- **WHEN** an authenticated non-admin calls `admin_assign_service_to_staff` or `admin_unassign_service_from_staff`
- **THEN** the RPC raises a "No autorizado" exception

### Requirement: Spanish copy for all staff service assignment UI states
The system MUST present all staff service assignment UI copy in Spanish for loading, empty, success, and error states.

#### Scenario: All visible copy is in Spanish
- **WHEN** any state of the staff service assignment panel is visible (loading, empty assignments, empty selector, assign success, unassign success, error)
- **THEN** all visible user-facing copy is displayed in Spanish

### Requirement: Test coverage for staff service assignment
The system MUST include automated test coverage for the staff service assignment feature.

#### Scenario: Service layer unit tests pass
- **WHEN** unit tests run for `adminStaffServices.ts`
- **THEN** tests validate parameter passing and camelCase mapping for all 4 RPC wrappers

#### Scenario: Integration tests cover core flows
- **WHEN** integration tests run for `AdminStaffServicesPage`
- **THEN** tests cover: loading state, empty assignments state, empty assignable services state, assign action updates list, unassign action removes row, RPC error shows Spanish message
