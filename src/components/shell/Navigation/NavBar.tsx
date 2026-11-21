import { useUser } from '../../../hooks/useUser'
import { UserMenu } from './UserMenu'
import { BrandLogo } from './BrandLogo'

export function NavBar() {
  const { user } = useUser()

  if (!user) return null

  return (
    <nav className="shell-bar sticky top-0 z-30 border-b" aria-label="Navegación superior">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left: Logo */}
        <div className="flex flex-shrink-0 items-center">
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
