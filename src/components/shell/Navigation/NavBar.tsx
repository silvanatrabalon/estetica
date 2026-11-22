import { useUser } from '../../../hooks/useUser'
import { UserMenu } from './UserMenu'
import { BrandLogo } from './BrandLogo'
import { useShellContext } from '../../../features/shell/hooks/useShellContext'

export function NavBar() {
  const { user } = useUser()
  const { isSidebarOpen, toggleSidebar } = useShellContext()

  if (!user) return null

  return (
    <nav className="shell-bar sticky top-0 z-30 border-b" aria-label="Navegación superior">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left: Logo */}
        <div className="flex flex-shrink-0 items-center">
          {/* Desktop only: hide or show the side menu */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarOpen ? 'Ocultar menú lateral' : 'Mostrar menú lateral'}
            aria-expanded={isSidebarOpen}
            aria-controls="primary-sidebar"
            title={isSidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
            className="mr-3 hidden h-9 w-9 items-center justify-center rounded-lg text-shell-subtleText hover:bg-shell-muted hover:text-shell-text focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] md:flex"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <BrandLogo />
          <h1 className="font-heading text-xl font-semibold text-shell-text md:text-2xl">Estética So Beauty</h1>
        </div>

        {/* Center: (Optional space for breadcrumbs or title) */}
        <div className="flex-1" />

        {/* Right: user menu. The menu itself opens from "Más" in the phone bottom bar. */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* User menu - always visible */}
          <UserMenu user={user} />
        </div>
      </div>
    </nav>
  )
}
