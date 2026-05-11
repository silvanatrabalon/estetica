import { useShellContext } from '../../../features/shell/hooks/useShellContext'
import { useUser } from '../../../hooks/useUser'
import { UserMenu } from './UserMenu'

export function NavBar() {
  const { toggleMobileMenu } = useShellContext()
  const { user } = useUser()

  if (!user) return null

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left: Logo */}
        <div className="flex items-center flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900">Estetica</h1>
        </div>

        {/* Center: (Optional space for breadcrumbs or title) */}
        <div className="flex-1" />

        {/* Right: Mobile menu button + User menu */}
        <div className="flex items-center gap-4">
          {/* Mobile hamburger button - visible only on mobile */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-gray-900"
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
