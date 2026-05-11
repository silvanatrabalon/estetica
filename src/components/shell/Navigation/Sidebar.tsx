import { useShellContext } from '../../../features/shell/hooks/useShellContext'
import type { NavItem } from '../../../features/shell/types'
import { NavLink } from './NavLink'
import { cn } from '../../../lib'

interface SidebarProps {
  items: NavItem[]
}

export function Sidebar({ items }: SidebarProps) {
  const { isMobileMenuOpen, closeMobileMenu } = useShellContext()

  // Get current pathname from window.location
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '/'

  const isActiveRoute = (href: string) => {
    return currentPathname === href || currentPathname.startsWith(href + '/')
  }

  const handleNavigation = () => {
    // Close mobile menu when navigating
    closeMobileMenu()
  }

  return (
    <>
      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={closeMobileMenu}
        className={cn(
          'fixed inset-0 z-30 bg-slate-900/45 opacity-0 md:hidden',
          'transition-opacity transition-overlay',
          isMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none'
        )}
      />

      {/* Sidebar - Desktop: fixed, always visible. Mobile: overlay drawer */}
      <aside
        id="primary-sidebar"
        aria-label="Primary navigation"
        className={cn(
          'shell-surface fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r md:relative md:top-0 md:h-screen',
          'translate-x-[-100%] transform transition-transform transition-structural md:translate-x-0',
          'shadow-shell md:shadow-none',
          isMobileMenuOpen && 'translate-x-0'
        )}
      >
        <nav className="p-4 md:p-6" aria-label="Sidebar links">
          {items.length === 0 ? (
            <div className="rounded-xl bg-shell-muted px-3 py-4 text-center text-sm text-shell-subtleText">
              No navigation items
            </div>
          ) : (
            <ul className="space-y-2" role="list">
              {items.map((item) => (
                <li key={item.id}>
                  <NavLink
                    item={item}
                    isActive={isActiveRoute(item.href)}
                    onNavigate={handleNavigation}
                  />
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>
    </>
  )
}
