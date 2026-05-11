import type { NavItem } from '../features/shell/types'

/**
 * Navigation configuration by role
 * Each role sees different navigation items
 */
export const navigationByRole: Record<'customer' | 'staff' | 'admin' | 'all', NavItem[]> = {
  // Shared items for all authenticated users
  all: [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: undefined, // TODO: Add dashboard icon from lucide-react or custom
      roles: ['customer', 'staff', 'admin'],
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      icon: undefined, // TODO: Add user icon
      roles: ['customer', 'staff', 'admin'],
    },
  ],

  // Customer-specific navigation
  customer: [
    {
      id: 'booking',
      label: 'Book Appointment',
      href: '/booking',
      icon: undefined, // TODO: Add calendar icon
      roles: ['customer'],
    },
    {
      id: 'appointments',
      label: 'My Appointments',
      href: '/appointments',
      icon: undefined, // TODO: Add list icon
      roles: ['customer'],
    },
  ],

  // Staff-specific navigation
  staff: [
    {
      id: 'schedule',
      label: 'Schedule',
      href: '/staff/schedule',
      icon: undefined, // TODO: Add calendar icon
      roles: ['staff', 'admin'],
    },
    {
      id: 'clients',
      label: 'Clients',
      href: '/staff/clients',
      icon: undefined, // TODO: Add users icon
      roles: ['staff', 'admin'],
    },
  ],

  // Admin-specific navigation
  admin: [
    {
      id: 'users',
      label: 'Users',
      href: '/admin/users',
      icon: undefined, // TODO: Add users icon
      roles: ['admin'],
    },
    {
      id: 'services',
      label: 'Services',
      href: '/admin/services',
      icon: undefined, // TODO: Add settings icon
      roles: ['admin'],
    },
    {
      id: 'reports',
      label: 'Reports',
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
