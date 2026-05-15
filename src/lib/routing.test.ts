import { describe, expect, it } from 'vitest'
import {
  canAccessRoute,
  getRoutePolicy,
  isKnownRoute,
  resolveAuthenticatedSignInRedirect,
  resolveRoleHomePath,
} from './routing'

describe('routing policy', () => {
  it('allows public routes for unauthenticated users', () => {
    expect(
      canAccessRoute({
        path: '/signin',
        isAuthenticated: false,
        role: null,
      }),
    ).toBe(true)
  })

  it('denies protected routes for unauthenticated users', () => {
    expect(
      canAccessRoute({
        path: '/dashboard',
        isAuthenticated: false,
        role: null,
      }),
    ).toBe(false)
  })

  it('allows role-restricted route for permitted role', () => {
    expect(
      canAccessRoute({
        path: '/staff/schedule',
        isAuthenticated: true,
        role: 'staff',
      }),
    ).toBe(true)
  })

  it('denies role-restricted route for non-permitted role', () => {
    expect(
      canAccessRoute({
        path: '/admin/users',
        isAuthenticated: true,
        role: 'staff',
      }),
    ).toBe(false)
  })

  it('allows admin-only business settings route for admins', () => {
    expect(
      canAccessRoute({
        path: '/admin/settings/business',
        isAuthenticated: true,
        role: 'admin',
      }),
    ).toBe(true)
  })

  it('allows admin-only staff management route for admins', () => {
    expect(
      canAccessRoute({
        path: '/admin/staff',
        isAuthenticated: true,
        role: 'admin',
      }),
    ).toBe(true)
  })

  it('returns role-restricted customer policy for booking confirmation path', () => {
    const policy = getRoutePolicy('/booking/confirmation/some-uuid')
    expect(policy?.access).toBe('role-restricted')
    expect(policy?.allowedRoles).toContain('customer')
  })

  it('denies booking confirmation path for unauthenticated users', () => {
    expect(
      canAccessRoute({
        path: '/booking/confirmation/some-uuid',
        isAuthenticated: false,
        role: null,
      }),
    ).toBe(false)
  })

  it('allows booking confirmation path for customer role', () => {
    expect(
      canAccessRoute({
        path: '/booking/confirmation/some-uuid',
        isAuthenticated: true,
        role: 'customer',
      }),
    ).toBe(true)
  })

  it('denies admin staff management route for non-admin roles', () => {
    expect(
      canAccessRoute({
        path: '/admin/staff',
        isAuthenticated: true,
        role: 'staff',
      }),
    ).toBe(false)
  })

  it('handles nested paths with registered prefixes', () => {
    const policy = getRoutePolicy('/staff/schedule/day')
    expect(policy?.path).toBe('/staff/schedule')
  })

  it('tracks known route paths', () => {
    expect(isKnownRoute('/profile')).toBe(true)
    expect(isKnownRoute('/profile/setup')).toBe(true)
    expect(isKnownRoute('/admin/settings/business')).toBe(true)
    expect(isKnownRoute('/admin/staff')).toBe(true)
    expect(isKnownRoute('/unknown')).toBe(false)
  })

  it('allows authenticated route access for profile setup', () => {
    expect(
      canAccessRoute({
        path: '/profile/setup',
        isAuthenticated: true,
        role: 'customer',
      }),
    ).toBe(true)
  })
})

describe('redirect resolution', () => {
  it('resolves sign-in redirect for authenticated users', () => {
    expect(
      resolveAuthenticatedSignInRedirect({
        isAuthenticated: true,
        role: 'admin',
        currentPath: '/signin',
      }),
    ).toBe('/admin/users')
  })

  it('returns null for unauthenticated users on sign-in', () => {
    expect(
      resolveAuthenticatedSignInRedirect({
        isAuthenticated: false,
        role: null,
        currentPath: '/signin',
      }),
    ).toBeNull()
  })

  it('returns null for non sign-in paths', () => {
    expect(
      resolveAuthenticatedSignInRedirect({
        isAuthenticated: true,
        role: 'customer',
        currentPath: '/dashboard',
      }),
    ).toBeNull()
  })

  it('maps role home paths deterministically', () => {
    expect(resolveRoleHomePath('customer')).toBe('/dashboard')
    expect(resolveRoleHomePath('staff')).toBe('/staff/schedule')
    expect(resolveRoleHomePath('admin')).toBe('/admin/users')
  })
})
