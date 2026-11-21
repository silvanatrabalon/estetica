import { describe, expect, it } from 'vitest'
import { getNavigationForRole } from './navigation'
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

  it('admin menu labels the users entry as Usuarios y roles', () => {
    const entry = getNavigationForRole('admin').find((i) => i.href === '/admin/users')
    expect(entry?.label).toBe('Usuarios y roles')
  })

  it('the per-user edit screen is covered by the admin-only users policy (edge case)', () => {
    expect(getRoutePolicy('/admin/users/abc-123')?.path).toBe('/admin/users')
    expect(canAccessRoute({ path: '/admin/users/abc-123', isAuthenticated: true, role: 'admin' })).toBe(true)
    expect(canAccessRoute({ path: '/admin/users/abc-123', isAuthenticated: true, role: 'staff' })).toBe(false)
    expect(canAccessRoute({ path: '/admin/users/abc-123', isAuthenticated: true, role: 'customer' })).toBe(false)
  })

  it('Calendario no longer exists: no route and no menu entry (edge case)', () => {
    expect(isKnownRoute('/admin/calendar')).toBe(false)
    expect(getRoutePolicy('/admin/calendar')).toBeUndefined()
    expect(getNavigationForRole('admin').some((i) => i.href === '/admin/calendar')).toBe(false)
    expect(getNavigationForRole('admin').some((i) => i.label === 'Calendario')).toBe(false)
  })

  it('Perfil is not in the side menu of any role: it opens from the user menu (edge case)', () => {
    for (const role of ['customer', 'staff', 'admin'] as const) {
      const items = getNavigationForRole(role)
      expect(items.some((i) => i.href === '/profile'), role).toBe(false)
      expect(items.some((i) => i.label === 'Perfil'), role).toBe(false)
    }
    // ...but the page itself is still reachable
    expect(isKnownRoute('/profile')).toBe(true)
  })

  it('Apariencia is admin-only (edge case)', () => {
    expect(isKnownRoute('/admin/appearance')).toBe(true)
    expect(canAccessRoute({ path: '/admin/appearance', isAuthenticated: true, role: 'admin' })).toBe(true)
    expect(canAccessRoute({ path: '/admin/appearance', isAuthenticated: true, role: 'staff' })).toBe(false)
    expect(canAccessRoute({ path: '/admin/appearance', isAuthenticated: true, role: 'customer' })).toBe(false)
    expect(canAccessRoute({ path: '/admin/appearance', isAuthenticated: false, role: null })).toBe(false)
  })

  it('admin menu has Apariencia and no separate Página pública entry', () => {
    const adminItems = getNavigationForRole('admin')
    expect(adminItems.find((i) => i.href === '/admin/appearance')?.label).toBe('Apariencia')
    expect(adminItems.some((i) => i.label === 'Página pública')).toBe(false)
  })

  it('non-admins do not see Apariencia in their menu (edge case)', () => {
    expect(getNavigationForRole('staff').some((i) => i.href === '/admin/appearance')).toBe(false)
    expect(getNavigationForRole('customer').some((i) => i.href === '/admin/appearance')).toBe(false)
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
    ).toBe('/admin/dashboard')
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
    expect(resolveRoleHomePath('admin')).toBe('/admin/dashboard')
  })
})
