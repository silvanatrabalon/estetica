## Why

The core context hooks (`useUser`, `useShellContext`, `useUserRole`, `useNavigation`) are critical to session management, role-based authorization, and UI state logic across the application. Without unit test coverage for these hooks, we risk undetected regressions and cannot confidently refactor or extend the context layer. This change establishes test coverage to ensure these foundational pieces remain reliable as the app grows.

## What Changes

- Add unit tests for `useUser()` hook with context access and error handling verification
- Add unit tests for `useShellContext()` hook with sidebar toggle state validation
- Add unit tests for `useUserRole()` hook with role extraction verification
- Add unit tests for `useNavigation()` hook with role-based nav filtering validation
- Achieve >80% code coverage for all context and hook logic
- Set up testing infrastructure (test runner, mocks, utilities) if not already present

## Capabilities

### New Capabilities
- `context-hooks-unit-testing`: Unit test suite for core React context hooks (useUser, useShellContext, useUserRole, useNavigation) with >80% coverage and comprehensive error handling scenarios

### Modified Capabilities
- `context-session-management`: No requirement changes; tests will validate existing behavior

## Impact

- **Code**: `src/hooks/`, `src/context/` will have corresponding test files
- **Dependencies**: May require testing library setup (Vitest or Jest, React Testing Library)
- **QA**: Establishes baseline test coverage for context layer; enables confidence in refactoring
- **Process**: Defines test patterns and utilities for future hook testing
