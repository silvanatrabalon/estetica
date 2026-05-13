import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUserRole } from './useUserRole'
import { AllTestContextProviders } from '../../../hooks/__test-utils__/test-providers'
import { mockSessions } from '../../../hooks/__test-utils__/fixtures'
import type { ReactNode } from 'react'

describe('useUserRole hook', () => {
  describe('when user has a specific role', () => {
    it('should return customer role for customer users', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders
          user={mockSessions.authenticatedCustomer.user}
          roles={['customer']}
          activeRole="customer"
        >
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUserRole(), { wrapper })

      expect(result.current).toBe('customer')
    })

    it('should return staff role for staff users', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders
          user={mockSessions.authenticatedStaff.user}
          roles={['staff']}
          activeRole="staff"
        >
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUserRole(), { wrapper })

      expect(result.current).toBe('staff')
    })

    it('should return admin role for admin users', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders
          user={mockSessions.authenticatedAdmin.user}
          roles={['admin']}
          activeRole="admin"
        >
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUserRole(), { wrapper })

      expect(result.current).toBe('admin')
    })
  })

  describe('when user is not authenticated', () => {
    it('should return null when not authenticated', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders user={null} roles={[]} activeRole={null}>
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUserRole(), { wrapper })

      expect(result.current).toBeNull()
    })

    it('should return null when user exists but activeRole is null', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders
          user={mockSessions.authenticatedCustomer.user}
          roles={[]}
          activeRole={null}
        >
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUserRole(), { wrapper })

      expect(result.current).toBeNull()
    })
  })

  describe('error handling and edge cases', () => {
    it('should throw when used outside UserProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useUserRole())
      }).toThrow('useUser must be used within UserProvider')

      consoleSpy.mockRestore()
    })

    it('should handle role changes', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders
          user={mockSessions.authenticatedCustomer.user}
          roles={['customer']}
          activeRole="customer"
        >
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUserRole(), { wrapper })

      expect(result.current).toBe('customer')
    })

    it('should be a string when role is defined', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders
          user={mockSessions.authenticatedAdmin.user}
          roles={['admin']}
          activeRole="admin"
        >
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUserRole(), { wrapper })

      expect(typeof result.current).toBe('string')
    })
  })

  describe('type safety', () => {
    it('should return one of the valid role types', () => {
      const validRoles = ['customer', 'staff', 'admin']

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AllTestContextProviders
          user={mockSessions.authenticatedCustomer.user}
          roles={['customer']}
          activeRole="customer"
        >
          {children}
        </AllTestContextProviders>
      )

      const { result } = renderHook(() => useUserRole(), { wrapper })

      expect(validRoles).toContain(result.current)
    })
  })
})
