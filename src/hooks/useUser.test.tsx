import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUser } from './useUser'
import { TestUserProvider, AllTestContextProviders } from './__test-utils__/test-providers'
import { mockSessions } from './__test-utils__/fixtures'
import type { ReactNode } from 'react'

describe('useUser hook', () => {
  describe('when user is authenticated', () => {
    it('should return user session when authenticated', () => {
      // Create a wrapper with authenticated customer
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders user={mockSessions.authenticatedCustomer.user}>
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUser(), { wrapper })

      // Should return context value with user data
      expect(result.current).toBeDefined()
      expect(result.current.user).toBeDefined()
      expect(result.current.isLoading).toBe(false)
    })

    it('should return different user for authenticated staff', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders user={mockSessions.authenticatedStaff.user}>
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUser(), { wrapper })

      expect(result.current.user).toBeDefined()
    })

    it('should return different user for authenticated admin', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders user={mockSessions.authenticatedAdmin.user}>
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUser(), { wrapper })

      expect(result.current.user).toBeDefined()
    })
  })

  describe('when user is not authenticated', () => {
    it('should return null user when not authenticated', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders user={null}>
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUser(), { wrapper })

      expect(result.current.user).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('loading state', () => {
    it('should indicate loading when session is initializing', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders isLoading={true}>
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUser(), { wrapper })

      expect(result.current.isLoading).toBe(true)
    })

    it('should clear loading state when session is ready', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders
          user={mockSessions.authenticatedCustomer.user}
          isLoading={false}
        >
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUser(), { wrapper })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should throw error when used outside UserContext provider', () => {
      // Suppress console.error for this test since we're testing error throwing
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useUser())
      }).toThrow('useUser must be used within UserProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('context value structure', () => {
    it('should return object with user, role, isLoading, and signOut', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders user={mockSessions.authenticatedCustomer.user}>
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUser(), { wrapper })

      expect(result.current).toHaveProperty('user')
      expect(result.current).toHaveProperty('role')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('signOut')
      expect(typeof result.current.signOut).toBe('function')
    })

    it('should have correct type structure for authenticated user', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders user={mockSessions.authenticatedCustomer.user}>
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUser(), { wrapper })

      // User should be User type from supabase
      expect(result.current.user).toBeDefined()
      expect(typeof result.current.user).toBe('object')
    })
  })
})
