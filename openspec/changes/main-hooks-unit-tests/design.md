## Context

The estetica application uses React context and custom hooks as the primary mechanism for session management, role-based authorization, and shell UI state (sidebar toggles, mobile menu). These hooks sit at the foundation of the app's architecture and are used by nearly every page and component:

- `useUser()` - accesses UserContext, provides session data and auth state
- `useShellContext()` - controls UI state for navigation sidebar and mobile drawer
- `useUserRole()` - derives role from context, used for conditional rendering
- `useNavigation()` - filters available routes based on user role

Currently, these hooks have no unit test coverage. As the app scales and undergoes refactoring, the lack of tests introduces risk of silent breakage and makes it harder to confidently modify the context layer.

## Goals / Non-Goals

**Goals:**
- Establish unit test suite for all 4 core hooks with >80% code coverage
- Test success paths, error states, and edge cases for each hook
- Create reusable test utilities and mocking patterns for context testing
- Enable confident refactoring of context layer in future
- Document testing patterns for new hooks added later

**Non-Goals:**
- Integration testing (component + hook interaction tests - different scope)
- E2E testing of authentication flows
- Testing UI components that consume hooks (component tests, not hook tests)
- Testing backend/Supabase logic (RLS, auth endpoints - separate tests)

## Decisions

### 1. Test Framework Choice: Vitest + React Testing Library

**Decision**: Use Vitest as the test runner with React Testing Library utilities for testing hooks.

**Rationale**: 
- Vitest is faster and more modular than Jest, well-suited for Vite projects
- React Testing Library's `renderHook` utility is the standard for unit testing React hooks in isolation
- Both are already present in the project stack or easy to add

**Alternatives Considered**:
- Jest with @testing-library/react: More heavyweight, slower feedback loop for a Vite project
- Manual mock approach: Would require more boilerplate and is error-prone

### 2. Mock Strategy: Minimal Mocks, Real Context Providers

**Decision**: Create test utilities that wrap hooks in a real context provider with test fixtures instead of mocking the entire context.

**Rationale**:
- Tests should verify actual hook behavior, not mock away the entire context layer
- This approach catches bugs in context interactions, not just hook logic
- Simpler to maintain (changes to context don't require updating mocks)

**Alternatives Considered**:
- Full mock of context: Easier initially but masks real integration bugs
- No mocks at all: Would require full Supabase and app setup per test (too slow)

### 3. Test Organization: Co-located Test Files

**Decision**: Place test files next to source files with `.test.ts` naming (e.g., `useUser.ts` → `useUser.test.ts`).

**Rationale**:
- Standard convention, easy to locate and maintain tests
- Clear 1:1 mapping between source and tests
- Easier to find tests when modifying hook code

### 4. Coverage Target: >80% for All Context Code

**Decision**: Aim for >80% line/branch coverage for `src/hooks/` and `src/context/`.

**Rationale**:
- 80% is a reasonable threshold that catches most branches without chasing diminishing returns
- High coverage enforces test discipline early; prevents degradation later
- Measurable, enforceable goal for CI/CD

## Risks / Trade-offs

[Risk: Maintenance Burden] → Mitigation: Create reusable test helpers to reduce boilerplate and make tests easier to update if hooks change

[Risk: Test Fragility] → Mitigation: Test behavior and state changes, not implementation details; avoid over-mocking

[Risk: Slow Tests if Not Careful] → Mitigation: Keep tests isolated, avoid unnecessary re-renders, use fast mocks for external dependencies (Supabase auth)

[Trade-off: Real vs Mock Context] → By using real context providers, tests are slower but more realistic. Acceptable for foundational layer that rarely changes

## Migration Plan

1. Set up Vitest and React Testing Library dependencies (if not present)
2. Create test utilities in `src/hooks/__test-utils__/` for context providers and fixtures
3. Implement individual test files for each hook
4. Run tests locally and verify coverage threshold is met
5. Commit and merge; CI should fail if coverage drops below 80%

## Open Questions

- Should we also test error boundaries or just hook behavior in isolation?
- Do we need snapshot tests for navigation config, or just behavioral tests?
