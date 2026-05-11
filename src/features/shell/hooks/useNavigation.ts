import { useMemo } from 'react'
import type { AppRole } from '../../../context/UserContext'
import type { NavItem } from '../types'
import { getNavigationForRole } from '../../../lib/navigation'

/**
 * Hook to get filtered navigation items for a specific role
 * Memoized to prevent unnecessary re-renders
 */
export function useNavigation(role: AppRole | null): NavItem[] {
  return useMemo(() => {
    if (!role) return []
    return getNavigationForRole(role)
  }, [role])
}
