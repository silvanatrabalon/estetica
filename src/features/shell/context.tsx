import { createContext, useContext, useState, ReactNode } from 'react'

export interface ShellContextValue {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  isMobileMenuOpen: boolean
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  isUserMenuOpen: boolean
  toggleUserMenu: () => void
  closeUserMenu: () => void
}

export const ShellContext = createContext<ShellContextValue | undefined>(undefined)

export function ShellProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // Only one overlay menu at a time: opening one closes the other.
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev)
    setIsUserMenuOpen(false)
  }
  const closeMobileMenu = () => setIsMobileMenuOpen(false)
  const toggleUserMenu = () => {
    setIsUserMenuOpen((prev) => !prev)
    setIsMobileMenuOpen(false)
  }
  const closeUserMenu = () => setIsUserMenuOpen(false)

  const value: ShellContextValue = {
    isSidebarOpen,
    toggleSidebar,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    isUserMenuOpen,
    toggleUserMenu,
    closeUserMenu,
  }

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
}

export function useShellContext() {
  const context = useContext(ShellContext)
  if (context === undefined) {
    throw new Error('useShellContext must be used within ShellProvider')
  }
  return context
}
