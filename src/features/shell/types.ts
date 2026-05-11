import React from 'react'
import type { AppRole } from '../../context/UserContext'

export type { AppRole }

export interface NavItem {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
  roles: AppRole[]
  children?: NavItem[]
}

export interface ShellContextValue {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  isMobileMenuOpen: boolean
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
}
