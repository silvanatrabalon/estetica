import type { NavItem } from '../features/shell/types'
import { navigationCopy } from './uiCopy'

/**
 * Navigation configuration by role
 * Each role sees different navigation items
 */
export const navigationByRole: Record<'customer' | 'staff' | 'admin' | 'all', NavItem[]> = {
  // Shared items for all authenticated users
  all: [
    {
      id: 'dashboard',
      label: navigationCopy.dashboard,
      href: '/dashboard',
      icon: undefined, // TODO: Add dashboard icon from lucide-react or custom
      roles: ['customer', 'staff', 'admin'],
    },
    {
      id: 'profile',
      label: navigationCopy.profile,
      href: '/profile',
      icon: undefined, // TODO: Add user icon
      roles: ['customer', 'staff', 'admin'],
    },
  ],

  // Customer-specific navigation
  customer: [
    {
      id: 'booking',
      label: navigationCopy.booking,
      href: '/booking',
      icon: undefined, // TODO: Add calendar icon
      roles: ['customer'],
    },
    {
      id: 'appointments',
      label: navigationCopy.appointments,
      href: '/appointments',
      icon: undefined, // TODO: Add list icon
      roles: ['customer'],
    },
  ],

  // Staff-specific navigation
  staff: [
    {
      id: 'schedule',
      label: navigationCopy.schedule,
      href: '/staff/schedule',
      icon: undefined, // TODO: Add calendar icon
      roles: ['staff', 'admin'],
    },
    {
      id: 'clients',
      label: navigationCopy.clients,
      href: '/staff/clients',
      icon: undefined, // TODO: Add users icon
      roles: ['staff', 'admin'],
    },
  ],

  // Admin-specific navigation
  admin: [
    {
      id: 'users',
      label: navigationCopy.users,
      href: '/admin/users',
      icon: undefined, // TODO: Add users icon
      roles: ['admin'],
    },
    {
      id: 'services',
      label: navigationCopy.services,
      href: '/admin/services',
      icon: undefined, // TODO: Add settings icon
      roles: ['admin'],
    },
    {
      id: 'reports',
      label: navigationCopy.reports,
      href: '/admin/reports',
      icon: undefined, // TODO: Add chart icon
      roles: ['admin'],
    },
  ],
}

/**
 * Get navigation items for a specific role
 * Combines shared items + role-specific items
 */
export function getNavigationForRole(role: 'customer' | 'staff' | 'admin'): NavItem[] {
  const shared = navigationByRole.all || []
  const roleSpecific = navigationByRole[role] || []
  return [...shared, ...roleSpecific]
}
