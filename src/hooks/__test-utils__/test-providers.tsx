import { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { UserContext, type AppRole } from '../../context/UserContext'
import { ShellContext, type ShellContextValue } from '../../features/shell/context'

/**
 * Test provider for UserContext
 * Injects test values directly into the real UserContext to test hooks correctly
 */
export function TestUserProvider({
  children,
  user = null,
  role = null,
  isLoading = false,
  onSignOut = async () => {},
  onRetryRoleResolution = async () => {},
}: {
  children: ReactNode
  user?: User | null
  role?: AppRole | null
  isLoading?: boolean
  onSignOut?: () => Promise<void>
  onRetryRoleResolution?: () => Promise<void>
}) {
  const value = {
    user,
    role,
    isLoading,
    signOut: onSignOut,
    retryRoleResolution: onRetryRoleResolution,
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
  role = null,
  isLoading = false,
  sidebarOpen = true,
}: {
  children: ReactNode
  user?: User | null
  role?: AppRole | null
  isLoading?: boolean
  sidebarOpen?: boolean
}) {
  return (
    <TestUserProvider user={user} role={role} isLoading={isLoading}>
      <TestShellProvider isSidebarOpen={sidebarOpen}>
        {children}
      </TestShellProvider>
    </TestUserProvider>
  )
}


