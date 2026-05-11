# Testing Guide

## Stack

- **Vitest** — test runner (`npm test` for watch mode, `npx vitest run` for single run)
- **@testing-library/react** — `renderHook` and `render` utilities
- **jsdom** — DOM environment for browser-like tests
- **@vitest/coverage-v8** — coverage reports (`npm run test:coverage`)

---

## Running Tests

```bash
# Watch mode
npm test

# Single run
npx vitest run

# Coverage report
npm run test:coverage
```

Coverage thresholds are set to **80%** in `vitest.config.ts` for `src/hooks/**` and `src/features/shell/hooks/**`.

---

## Hook Testing Pattern

Hooks that depend on React context cannot be tested in isolation — they require their context to be present. This project uses **direct context injection** via the real context objects instead of wrapping with the full provider (which would trigger Supabase calls and other side effects).

### Test Utilities

All test helpers live in `src/hooks/__test-utils__/`:

| File | Purpose |
|---|---|
| `test-providers.tsx` | Injects mock values into real `UserContext` and `ShellContext` |
| `fixtures.ts` | Reusable mock data: users, roles, session states, navigation config |
| `render-hook-with-context.tsx` | `renderHookWithContext` wrapper combining both providers |
| `index.ts` | Barrel export for all utilities |

### Context Injection Pattern

Instead of mounting the real `UserProvider` (which calls Supabase on mount), tests inject values directly into `UserContext.Provider`:

```tsx
// ✅ Correct — inject into the real context object
import { UserContext } from '../../context/UserContext'

function TestUserProvider({ children, user, role, isLoading }) {
  return (
    <UserContext.Provider value={{ user, role, isLoading, signOut: async () => {} }}>
      {children}
    </UserContext.Provider>
  )
}

// ✗ Avoid — mounting real UserProvider triggers Supabase effects
import { UserProvider } from '../../context/UserContext'
```

This requires `UserContext` and `ShellContext` to be **exported** from their respective files.

### Writing a Hook Test

```tsx
import { renderHook } from '@testing-library/react'
import { useUser } from './useUser'
import { TestUserProvider } from '../__test-utils__/test-providers'
import { mockSessions } from '../__test-utils__/fixtures'

it('returns user when authenticated', () => {
  const { user, role } = mockSessions.authenticatedCustomer

  const wrapper = ({ children }) => (
    <TestUserProvider user={user} role={role}>
      {children}
    </TestUserProvider>
  )

  const { result } = renderHook(() => useUser(), { wrapper })

  expect(result.current.user).toEqual(user)
  expect(result.current.role).toBe('customer')
})
```

### Testing "throws outside provider"

Use `expect(...).toThrow()` with `renderHook` and no wrapper:

```tsx
it('throws when used outside provider', () => {
  expect(() => renderHook(() => useUser())).toThrow(
    'useUser must be used within UserProvider'
  )
})
```

> **Note:** React logs these errors to stderr. They are expected in the "throws" tests and do not indicate a real failure.

---

## Available Fixtures

```ts
import { mockSessions, mockUsers, mockRoles, mockShellStates } from './__test-utils__/fixtures'

mockSessions.authenticatedCustomer  // { user: User, role: 'customer' }
mockSessions.authenticatedStaff     // { user: User, role: 'staff' }
mockSessions.authenticatedAdmin     // { user: User, role: 'admin' }
mockSessions.unauthenticated        // { user: null, role: null }
mockSessions.loading                // { user: null, role: null, isLoading: true }

mockShellStates.sidebarOpen         // { isSidebarOpen: true, isMobileMenuOpen: false }
mockShellStates.sidebarClosed       // { isSidebarOpen: false, isMobileMenuOpen: false }
mockShellStates.mobileMenuOpen      // { isSidebarOpen: true, isMobileMenuOpen: true }
```

---

## Test File Conventions

- Files with JSX must use `.tsx` extension (e.g. `useUser.test.tsx`)
- Files with no JSX can use `.ts` (e.g. `useNavigation.test.ts`)
- Test files live next to the hook they test
- Import from the hook file directly (not from the context) to ensure coverage is tracked correctly

```ts
// ✅ Import from the hook file
import { useUser } from './useUser'

// ✗ Avoid importing directly from context in hook tests
import { useUser } from '../context/UserContext'
```
