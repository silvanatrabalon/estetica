import type { User } from '@supabase/supabase-js'
import type { AppRole } from '../context/UserContext'

/**
 * Reusable test fixtures for hook testing
 * Provides mock users, roles, and session states
 */

export const mockUsers = {
  customer: {
    id: 'user-customer-123',
    email: 'customer@example.com',
    user_metadata: {
      name: 'Customer User',
    },
  } as User,
  
  staff: {
    id: 'user-staff-456',
    email: 'staff@example.com',
    user_metadata: {
      name: 'Staff Member',
    },
  } as User,

  admin: {
    id: 'user-admin-789',
    email: 'admin@example.com',
    user_metadata: {
      name: 'Admin User',
    },
  } as User,
}

export const mockRoles: Record<string, AppRole> = {
  customer: 'customer',
  staff: 'staff',
  admin: 'admin',
  guest: null as unknown as AppRole, // For unauthenticated state
}

/**
 * Session states for testing different authentication scenarios
 */
export const mockSessions = {
  authenticatedCustomer: {
    user: mockUsers.customer,
    role: 'customer' as AppRole,
    isLoading: false,
  },
  
  authenticatedStaff: {
    user: mockUsers.staff,
    role: 'staff' as AppRole,
    isLoading: false,
  },

  authenticatedAdmin: {
    user: mockUsers.admin,
    role: 'admin' as AppRole,
    isLoading: false,
  },

  unauthenticated: {
    user: null,
    role: null,
    isLoading: false,
  },

  loading: {
    user: null,
    role: null,
    isLoading: true,
  },
}

/**
 * Navigation routes filtered by role
 * Used for testing navigation filtering
 */
export const mockNavigationConfig = {
  customer: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Bookings', path: '/bookings' },
    { label: 'Profile', path: '/profile' },
  ],
  
  staff: [
    { label: 'Schedule', path: '/staff-schedule' },
    { label: 'Bookings', path: '/staff-bookings' },
    { label: 'Profile', path: '/profile' },
  ],

  admin: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Users', path: '/admin/users' },
    { label: 'Settings', path: '/admin/settings' },
    { label: 'Analytics', path: '/admin/analytics' },
  ],
}

/**
 * Shell UI states for testing sidebar and menu toggle
 */
export const mockShellStates = {
  sidebarOpen: {
    isOpen: true,
  },

  sidebarClosed: {
    isOpen: false,
  },

  mobileDefault: {
    isOpen: false, // Mobile defaults to closed
  },

  desktopDefault: {
    isOpen: true, // Desktop defaults to open
  },
}
