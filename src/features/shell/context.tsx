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

const SIDEBAR_KEY = 'shell.sidebarOpen'

function readSidebarPreference(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) !== 'false'
  } catch {
    return true
  }
}

function writeSidebarPreference(open: boolean): void {
  try {
    window.localStorage.setItem(SIDEBAR_KEY, String(open))
  } catch {
    // Private mode or blocked storage: the menu just goes back to open on reload
  }
}

export const ShellContext = createContext<ShellContextValue | undefined>(undefined)

export function ShellProvider({ children }: { children: ReactNode }) {
  // Desktop only: the side menu can be hidden, and the choice is remembered in this browser.
  const [isSidebarOpen, setIsSidebarOpen] = useState(readSidebarPreference)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleSidebar = () =>
    setIsSidebarOpen((prev) => {
      writeSidebarPreference(!prev)
      return !prev
    })
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
