## ADDED Requirements

### Requirement: useUser hook shall provide session context access
The `useUser()` hook SHALL return the current user session and auth state from UserContext, and SHALL throw or return a meaningful error when called outside a UserContext provider.

#### Scenario: Hook returns session when user is authenticated
- **WHEN** `useUser()` is called within a UserContext provider with an authenticated session
- **THEN** the hook returns an object containing user ID, email, and auth metadata

#### Scenario: Hook handles missing context gracefully
- **WHEN** `useUser()` is called without a UserContext provider
- **THEN** the hook throws an error with a helpful message indicating UserContext is required

#### Scenario: Hook returns null session for unauthenticated state
- **WHEN** `useUser()` is called within UserContext but no session exists
- **THEN** the hook returns a user object with null or undefined session property

### Requirement: useShellContext hook shall manage sidebar and menu toggle state
The `useShellContext()` hook SHALL return sidebar toggle state (open/closed) and provide methods to toggle the sidebar, and SHALL handle mobile vs desktop states appropriately.

#### Scenario: Hook returns sidebar toggle state
- **WHEN** `useShellContext()` is called within a ShellContext provider
- **THEN** the hook returns an object with `isOpen` boolean and `toggleSidebar()` function

#### Scenario: Hook updates sidebar state when toggleSidebar is called
- **WHEN** `toggleSidebar()` is invoked
- **THEN** the hook's `isOpen` state flips (true → false or false → true)

#### Scenario: Hook initializes with correct default state for viewport
- **WHEN** `useShellContext()` is called on desktop viewport
- **THEN** the hook returns `isOpen: true` by default
- **WHEN** `useShellContext()` is called on mobile viewport
- **THEN** the hook returns `isOpen: false` by default

#### Scenario: Hook handles missing context gracefully
- **WHEN** `useShellContext()` is called without a ShellContext provider
- **THEN** the hook throws an error with a helpful message

### Requirement: useUserRole hook shall extract and return user role
The `useUserRole()` hook SHALL extract the user's role from UserContext and return it in a consistent format, handling missing users or invalid roles gracefully.

#### Scenario: Hook returns user role when authenticated
- **WHEN** `useUserRole()` is called for a user with role "customer"
- **THEN** the hook returns "customer"
- **WHEN** `useUserRole()` is called for a user with role "staff"
- **THEN** the hook returns "staff"
- **WHEN** `useUserRole()` is called for a user with role "admin"
- **THEN** the hook returns "admin"

#### Scenario: Hook returns null or default when user is not authenticated
- **WHEN** `useUserRole()` is called without an active session
- **THEN** the hook returns null or "guest"

#### Scenario: Hook handles invalid or missing role data
- **WHEN** `useUserRole()` is called and the user's role property is undefined
- **THEN** the hook returns a sensible default without throwing

### Requirement: useNavigation hook shall filter routes by user role
The `useNavigation()` hook SHALL return a list of available routes filtered by the current user's role, preventing unauthorized navigation options in the UI.

#### Scenario: Hook returns customer routes for customer role
- **WHEN** `useNavigation()` is called for a user with role "customer"
- **THEN** the hook returns an array including routes like `/dashboard`, `/bookings`, `/profile`
- **AND** the hook does NOT include admin routes like `/admin/users`

#### Scenario: Hook returns staff routes for staff role
- **WHEN** `useNavigation()` is called for a user with role "staff"
- **THEN** the hook returns an array including routes like `/staff-schedule`, `/bookings`, `/profile`
- **AND** the hook does NOT include customer routes like `/bookings` (staff has different booking view)

#### Scenario: Hook returns admin routes for admin role
- **WHEN** `useNavigation()` is called for a user with role "admin"
- **THEN** the hook returns an array including all routes: `/dashboard`, `/admin/users`, `/settings`, etc.

#### Scenario: Hook handles unauthenticated state
- **WHEN** `useNavigation()` is called without an authenticated session
- **THEN** the hook returns only public routes (or empty array for protected app)

#### Scenario: Navigation config changes do not break filtering
- **WHEN** navigation config is updated to add a new route
- **THEN** the hook correctly applies role filtering to the new route without requiring hook code changes

### Requirement: Unit test suite shall achieve >80% code coverage
The test suite for all four hooks and UserContext/ShellContext implementation SHALL achieve >80% line and branch coverage, as verified by coverage reporting tools.

#### Scenario: Coverage report shows >80% for context hooks
- **WHEN** test suite is executed with coverage reporting enabled
- **THEN** coverage report shows >80% line coverage for `src/hooks/`
- **AND** coverage report shows >80% branch coverage for `src/hooks/`

#### Scenario: Coverage report shows >80% for context implementation
- **WHEN** test suite is executed with coverage reporting enabled
- **THEN** coverage report shows >80% line coverage for `src/context/`
- **AND** coverage report shows >80% branch coverage for `src/context/`

#### Scenario: CI fails if coverage drops below threshold
- **WHEN** a commit reduces test coverage below 80%
- **THEN** CI/CD pipeline fails and prevents merge until coverage is restored
