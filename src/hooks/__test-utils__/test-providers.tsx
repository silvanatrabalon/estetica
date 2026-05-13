import { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { UserContext, type AppRole } from '../../context/UserContext'
import { ShellContext, type ShellContextValue } from '../../features/shell/context'
import type { ProfileBootstrapStatus, ProfileRecord } from '../../lib/profile'

/**
 * Test provider for UserContext
 * Injects test values directly into the real UserContext to test hooks correctly
 */
export function TestUserProvider({
  children,
  user = null,
  roles = [],
  activeRole = null,
  setActiveRole = () => {},
  isLoading = false,
  profile = null,
  profileStatus = 'complete',
  profileWarning = null,
  onSignOut = async () => {},
  onRetryRoleResolution = async () => {},
  onRetryProfileBootstrap = async () => {},
  onRefreshProfile = async () => {},
}: {
  children: ReactNode
  user?: User | null
  roles?: AppRole[]
  activeRole?: AppRole | null
  setActiveRole?: (role: AppRole) => void
  isLoading?: boolean
  profile?: ProfileRecord | null
  profileStatus?: ProfileBootstrapStatus
  profileWarning?: string | null
  onSignOut?: () => Promise<void>
  onRetryRoleResolution?: () => Promise<void>
  onRetryProfileBootstrap?: () => Promise<void>
  onRefreshProfile?: () => Promise<void>
}) {
  const value = {
    user,
    roles,
    activeRole,
    setActiveRole,
    profile,
    profileStatus,
    profileWarning,
    isLoading,
    signOut: onSignOut,
    retryRoleResolution: onRetryRoleResolution,
    retryProfileBootstrap: onRetryProfileBootstrap,
    refreshProfile: onRefreshProfile,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

/**
 * Test provider for ShellContext
 * Injects test values directly into the real ShellContext to test hooks correctly
 */
export function TestShellProvider({
  children,
  isSidebarOpen = true,
  isMobileMenuOpen = false,
  onToggleSidebar = () => {},
  onToggleMobileMenu = () => {},
  onCloseMobileMenu = () => {},
}: {
  children: ReactNode
  isSidebarOpen?: boolean
  isMobileMenuOpen?: boolean
  onToggleSidebar?: () => void
  onToggleMobileMenu?: () => void
  onCloseMobileMenu?: () => void
}) {
  const value: ShellContextValue = {
    isSidebarOpen,
    toggleSidebar: onToggleSidebar,
    isMobileMenuOpen,
    toggleMobileMenu: onToggleMobileMenu,
    closeMobileMenu: onCloseMobileMenu,
  }

  return (
    <ShellContext.Provider value={value}>
      {children}
    </ShellContext.Provider>
  )
}

/**
 * Combined test context wrapper with both UserContext and ShellContext
 */
export function AllTestContextProviders({
  children,
  user = null,
  roles = [],
  activeRole = null,
  isLoading = false,
  sidebarOpen = true,
}: {
  children: ReactNode
  user?: User | null
  roles?: AppRole[]
  activeRole?: AppRole | null
  isLoading?: boolean
  sidebarOpen?: boolean
}) {
  return (
    <TestUserProvider user={user} roles={roles} activeRole={activeRole} isLoading={isLoading}>
      <TestShellProvider isSidebarOpen={sidebarOpen}>
        {children}
      </TestShellProvider>
    </TestUserProvider>
  )
}


