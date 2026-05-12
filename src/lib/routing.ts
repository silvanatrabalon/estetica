import type { AppRole } from '../context/UserContext'

export type RouteAccess = 'public' | 'authenticated' | 'role-restricted'

export interface RoutePolicy {
  path: string
  access: RouteAccess
  allowedRoles?: AppRole[]
}

export const roleHomeByRole: Record<AppRole, string> = {
  customer: '/dashboard',
  staff: '/staff/schedule',
  admin: '/admin/users',
}

export const routePolicies: RoutePolicy[] = [
  { path: '/', access: 'public' },
  { path: '/signin', access: 'public' },
  { path: '/dashboard', access: 'authenticated' },
  { path: '/profile', access: 'authenticated' },
  { path: '/profile/setup', access: 'authenticated' },
  { path: '/unauthorized', access: 'authenticated' },
  { path: '/booking', access: 'role-restricted', allowedRoles: ['customer'] },
  { path: '/appointments', access: 'role-restricted', allowedRoles: ['customer'] },
  { path: '/staff/schedule', access: 'role-restricted', allowedRoles: ['staff', 'admin'] },
  { path: '/staff/clients', access: 'role-restricted', allowedRoles: ['staff', 'admin'] },
  { path: '/admin/users', access: 'role-restricted', allowedRoles: ['admin'] },
  { path: '/admin/services', access: 'role-restricted', allowedRoles: ['admin'] },
  { path: '/admin/reports', access: 'role-restricted', allowedRoles: ['admin'] },
]

export interface RouteAccessInput {
  path: string
  isAuthenticated: boolean
  role: AppRole | null
}

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1)
  }

  return path
}

export function getRoutePolicy(path: string): RoutePolicy | undefined {
  const normalizedPath = normalizePath(path)

  return routePolicies.find((policy) => {
    if (policy.path === normalizedPath) {
      return true
    }

    if (policy.path !== '/' && normalizedPath.startsWith(`${policy.path}/`)) {
      return true
    }

    return false
  })
}

export function isKnownRoute(path: string): boolean {
  return Boolean(getRoutePolicy(path))
}

export function canAccessRoute({ path, isAuthenticated, role }: RouteAccessInput): boolean {
  const policy = getRoutePolicy(path)

  if (!policy) {
    return false
  }

  if (policy.access === 'public') {
    return true
  }

  if (!isAuthenticated) {
    return false
  }

  if (policy.access === 'authenticated') {
    return true
  }

  if (!role) {
    return false
  }

  return policy.allowedRoles?.includes(role) ?? false
}

export function resolveRoleHomePath(role: AppRole): string {
  return roleHomeByRole[role]
}

export function resolveAuthenticatedSignInRedirect(input: {
  isAuthenticated: boolean
  role: AppRole | null
  currentPath: string
}): string | null {
  const normalizedPath = normalizePath(input.currentPath)

  if (!input.isAuthenticated || normalizedPath !== '/signin' || !input.role) {
    return null
  }

  return resolveRoleHomePath(input.role)
}
