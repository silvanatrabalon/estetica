## 1. Setup & Dependencies

- [x] 1.1 Install Vitest as test runner: `npm install --save-dev vitest @vitest/ui`
- [x] 1.2 Install React Testing Library for hook testing: `npm install --save-dev @testing-library/react @testing-library/jest-dom`
- [x] 1.3 Create `vitest.config.ts` with proper React and DOM environment setup
- [x] 1.4 Update `package.json` test script: `"test": "vitest"` and `"test:coverage": "vitest --coverage"`
- [x] 1.5 Verify test runner works: `npm test -- --version`

## 2. Test Utilities & Setup

- [x] 2.1 Create `src/hooks/__test-utils__/` directory for test helpers
- [x] 2.2 Create `src/hooks/__test-utils__/test-providers.tsx` with UserContext and ShellContext test providers
- [x] 2.3 Create `src/hooks/__test-utils__/fixtures.ts` with reusable test data (mock users, mock roles, mock session states)
- [x] 2.4 Create `src/hooks/__test-utils__/render-hook-with-context.tsx` wrapper for consistent test setup
- [x] 2.5 Update `src/hooks/__test-utils__/index.ts` to export all utilities

## 3. useUser Hook Tests

- [x] 3.1 Create `src/hooks/useUser.test.tsx` file
- [x] 3.2 Add test: "returns user session when authenticated"
- [x] 3.3 Add test: "returns null session when unauthenticated"
- [x] 3.4 Add test: "throws error when used outside UserContext provider"
- [x] 3.5 Add test: "updates when session changes"
- [x] 3.6 Add test: "handles edge case: empty user object"

## 4. useShellContext Hook Tests

- [x] 4.1 Create `src/features/shell/hooks/useShellContext.test.tsx` file
- [x] 4.2 Add test: "returns sidebar state and toggle function"
- [x] 4.3 Add test: "toggleSidebar flips isOpen state"
- [x] 4.4 Add test: "initializes with correct desktop default (isOpen: true)"
- [x] 4.5 Add test: "initializes with correct mobile default (isOpen: false)"
- [x] 4.6 Add test: "throws error when used outside ShellContext provider"
- [x] 4.7 Add test: "multiple toggles work correctly"

## 5. useUserRole Hook Tests

- [x] 5.1 Create `src/features/shell/hooks/useUserRole.test.tsx` file
- [x] 5.2 Add test: "returns 'customer' role for customer users"
- [x] 5.3 Add test: "returns 'staff' role for staff users"
- [x] 5.4 Add test: "returns 'admin' role for admin users"
- [x] 5.5 Add test: "returns null or 'guest' when not authenticated"
- [x] 5.6 Add test: "handles missing role property gracefully"
- [x] 5.7 Add test: "updates when user context changes"

## 6. useNavigation Hook Tests

- [x] 6.1 Create `src/features/shell/hooks/useNavigation.test.ts` file
- [x] 6.2 Add test: "returns customer routes for customer role"
- [x] 6.3 Add test: "customer routes do not include admin routes"
- [x] 6.4 Add test: "returns staff routes for staff role"
- [x] 6.5 Add test: "returns admin routes for admin role"
- [x] 6.6 Add test: "returns empty or public routes when unauthenticated"
- [x] 6.7 Add test: "route filtering uses current user role"
- [x] 6.8 Add test: "handles empty navigation config"

## 7. UserContext Tests (if needed)

- [~] 7.1 Skipped — provider logic depends on Supabase effects; unit tested via hook tests
- [~] 7.2 Skipped
- [~] 7.3 Skipped

## 8. ShellContext Tests (if needed)

- [~] 8.1 Skipped — context behavior fully covered by useShellContext tests
- [~] 8.2 Skipped
- [~] 8.3 Skipped

## 9. Coverage & Verification

- [x] 9.1 Run test suite: `npm run test:coverage`
- [x] 9.2 Verify coverage report shows >80% for `src/hooks/` and `src/features/shell/hooks/`
- [~] 9.3 `src/context/` skipped — Supabase provider code not testable without integration setup
- [~] 9.4 Uncovered: re-export files (`useUser.ts`, `useUserRole.ts`, `index.ts`) — 0% by V8 design for pure re-exports
- [x] 9.5 Coverage thresholds enforced via `vitest.config.ts` (80% on included hook files)
- [~] 9.6 CI configuration not yet in scope for this change

## 10. Documentation & Cleanup

- [x] 10.1 Test utilities have comment blocks explaining the injection pattern
- [x] 10.2 Create `docs/testing.md` with hook testing patterns and best practices
- [x] 10.3 Commit test code with descriptive message: "test: add unit tests for core context hooks"
- [x] 10.4 Verify all tests pass: `npm test` — 4 files, 39 tests ✓
