import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ShellProvider, useShellContext } from './context'

const wrapper = ({ children }: { children: ReactNode }) => <ShellProvider>{children}</ShellProvider>

describe('ShellProvider overlay menus', () => {
  it('starts with both menus closed', () => {
    const { result } = renderHook(() => useShellContext(), { wrapper })
    expect(result.current.isMobileMenuOpen).toBe(false)
    expect(result.current.isUserMenuOpen).toBe(false)
  })

  it('opening the user menu closes the mobile menu', () => {
    const { result } = renderHook(() => useShellContext(), { wrapper })
    act(() => result.current.toggleMobileMenu())
    expect(result.current.isMobileMenuOpen).toBe(true)

    act(() => result.current.toggleUserMenu())
    expect(result.current.isUserMenuOpen).toBe(true)
    expect(result.current.isMobileMenuOpen).toBe(false)
  })

  it('opening the mobile menu closes the user menu', () => {
    const { result } = renderHook(() => useShellContext(), { wrapper })
    act(() => result.current.toggleUserMenu())
    act(() => result.current.toggleMobileMenu())
    expect(result.current.isMobileMenuOpen).toBe(true)
    expect(result.current.isUserMenuOpen).toBe(false)
  })

  it('toggling the same menu twice closes it (edge case)', () => {
    const { result } = renderHook(() => useShellContext(), { wrapper })
    act(() => result.current.toggleUserMenu())
    act(() => result.current.toggleUserMenu())
    expect(result.current.isUserMenuOpen).toBe(false)
  })

  it('closeUserMenu and closeMobileMenu are idempotent (edge case)', () => {
    const { result } = renderHook(() => useShellContext(), { wrapper })
    act(() => {
      result.current.closeUserMenu()
      result.current.closeMobileMenu()
    })
    expect(result.current.isUserMenuOpen).toBe(false)
    expect(result.current.isMobileMenuOpen).toBe(false)
  })
})

describe('ShellProvider side menu on desktop', () => {
  beforeEach(() => window.localStorage.clear())

  it('starts open and toggles', () => {
    const { result } = renderHook(() => useShellContext(), { wrapper })
    expect(result.current.isSidebarOpen).toBe(true)
    act(() => result.current.toggleSidebar())
    expect(result.current.isSidebarOpen).toBe(false)
    act(() => result.current.toggleSidebar())
    expect(result.current.isSidebarOpen).toBe(true)
  })

  it('remembers the choice for the next visit', () => {
    const first = renderHook(() => useShellContext(), { wrapper })
    act(() => first.result.current.toggleSidebar())
    first.unmount()
    const second = renderHook(() => useShellContext(), { wrapper })
    expect(second.result.current.isSidebarOpen).toBe(false)
  })

  it('does not touch the phone menu (edge case)', () => {
    const { result } = renderHook(() => useShellContext(), { wrapper })
    act(() => result.current.toggleMobileMenu())
    act(() => result.current.toggleSidebar())
    expect(result.current.isMobileMenuOpen).toBe(true)
  })

  it('still works when the browser blocks storage (edge case)', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = renderHook(() => useShellContext(), { wrapper })
    expect(result.current.isSidebarOpen).toBe(true)
    act(() => result.current.toggleSidebar())
    expect(result.current.isSidebarOpen).toBe(false)
    get.mockRestore()
    set.mockRestore()
  })
})
