import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useShellContext } from './useShellContext'
import { TestShellProvider } from '../../../hooks/__test-utils__/test-providers'
import type { ReactNode } from 'react'

describe('useShellContext hook', () => {
  describe('sidebar state', () => {
    it('should return sidebar state and toggle function', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <TestShellProvider isSidebarOpen={true}>
          {children}
        </TestShellProvider>
      )

      const { result } = renderHook(() => useShellContext(), { wrapper })

      expect(result.current).toBeDefined()
      expect(result.current).toHaveProperty('isSidebarOpen')
      expect(result.current).toHaveProperty('toggleSidebar')
      expect(typeof result.current.toggleSidebar).toBe('function')
    })

    it('should have isSidebarOpen as true when initialized', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <TestShellProvider isSidebarOpen={true}>
          {children}
        </TestShellProvider>
      )

      const { result } = renderHook(() => useShellContext(), { wrapper })

      expect(result.current.isSidebarOpen).toBe(true)
    })

    it('should have isSidebarOpen as false when initialized with false', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <TestShellProvider isSidebarOpen={false}>
          {children}
        </TestShellProvider>
      )

      const { result } = renderHook(() => useShellContext(), { wrapper })

      expect(result.current.isSidebarOpen).toBe(false)
    })
  })

  describe('mobile menu state', () => {
    it('should return mobile menu state and toggle function', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <TestShellProvider isMobileMenuOpen={false}>
          {children}
        </TestShellProvider>
      )

      const { result } = renderHook(() => useShellContext(), { wrapper })

      expect(result.current).toHaveProperty('isMobileMenuOpen')
      expect(result.current).toHaveProperty('toggleMobileMenu')
      expect(typeof result.current.toggleMobileMenu).toBe('function')
    })

    it('should have closeMobileMenu function', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <TestShellProvider>
          {children}
        </TestShellProvider>
      )

      const { result } = renderHook(() => useShellContext(), { wrapper })

      expect(result.current).toHaveProperty('closeMobileMenu')
      expect(typeof result.current.closeMobileMenu).toBe('function')
    })
  })

  describe('error handling', () => {
    it('should throw error when used outside ShellProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useShellContext())
      }).toThrow('useShellContext must be used within ShellProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('context value structure', () => {
    it('should have all expected properties', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <TestShellProvider>
          {children}
        </TestShellProvider>
      )

      const { result } = renderHook(() => useShellContext(), { wrapper })

      expect(result.current).toHaveProperty('isSidebarOpen')
      expect(result.current).toHaveProperty('toggleSidebar')
      expect(result.current).toHaveProperty('isMobileMenuOpen')
      expect(result.current).toHaveProperty('toggleMobileMenu')
      expect(result.current).toHaveProperty('closeMobileMenu')
    })

    it('should have correct property types', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <TestShellProvider>
          {children}
        </TestShellProvider>
      )

      const { result } = renderHook(() => useShellContext(), { wrapper })

      expect(typeof result.current.isSidebarOpen).toBe('boolean')
      expect(typeof result.current.toggleSidebar).toBe('function')
      expect(typeof result.current.isMobileMenuOpen).toBe('boolean')
      expect(typeof result.current.toggleMobileMenu).toBe('function')
      expect(typeof result.current.closeMobileMenu).toBe('function')
    })
  })
})
