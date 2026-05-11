import { createContext, useContext, useState, ReactNode } from 'react'

interface ShellContextValue {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  isMobileMenuOpen: boolean
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
}

export const ShellContext = createContext<ShellContextValue | undefined>(undefined)

export function ShellProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev)
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const value: ShellContextValue = {
    isSidebarOpen,
    toggleSidebar,
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
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
