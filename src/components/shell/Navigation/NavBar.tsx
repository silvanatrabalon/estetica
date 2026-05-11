import { useShellContext } from '../../../features/shell/hooks/useShellContext'
import { useUser } from '../../../hooks/useUser'
import { UserMenu } from './UserMenu'

export function NavBar() {
  const { toggleMobileMenu, isMobileMenuOpen } = useShellContext()
  const { user } = useUser()

  if (!user) return null

  return (
    <nav className="shell-surface sticky top-0 z-30 border-b" aria-label="Top navigation">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left: Logo */}
        <div className="flex flex-shrink-0 items-center">
          <h1 className="font-heading text-xl font-semibold text-shell-text md:text-2xl">Estetica</h1>
        </div>

        {/* Center: (Optional space for breadcrumbs or title) */}
        <div className="flex-1" />

        {/* Right: Mobile menu button + User menu */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile hamburger button - visible only on mobile */}
          <button
            onClick={toggleMobileMenu}
            className="transition-micro rounded-xl border border-transparent p-2 text-shell-text hover:border-shell-border hover:bg-shell-muted focus-visible:border-brand-primary md:hidden"
            aria-label="Toggle navigation menu"
            aria-controls="primary-sidebar"
            aria-expanded={isMobileMenuOpen}
            aria-haspopup="true"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* User menu - always visible */}
          <UserMenu user={user} />
        </div>
      </div>
    </nav>
  )
}
