/**
 * Test utilities for hook testing
 * 
 * Usage:
 *   import { renderHookWithContext, mockSessions } from './__test-utils__'
 *
 * These utilities streamline writing unit tests for React hooks by:
 * - Providing pre-configured context providers using real contexts
 * - Offering reusable mock data (users, roles, sessions)
 * - Reducing boilerplate in test setup
 */

export {
  TestUserProvider,
  TestShellProvider,
  AllTestContextProviders,
} from './test-providers'

export {
  renderHookWithContext,
  renderWithContext,
} from './render-hook-with-context'

export {
  mockUsers,
  mockRoles,
  mockSessions,
  mockNavigationConfig,
  mockShellStates,
} from './fixtures'
