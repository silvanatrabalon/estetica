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
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Desktop: fixed, always visible. Mobile: overlay drawer */}
      <aside
        className={cn(
          'fixed md:relative top-16 md:top-0 left-0 h-[calc(100vh-4rem)] md:h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto z-40',
          'transform transition-transform duration-300 ease-in-out md:transform-none',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <nav className="p-4 space-y-2">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              No navigation items
            </div>
          ) : (
            items.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                isActive={isActiveRoute(item.href)}
                onNavigate={handleNavigation}
              />
            ))
          )}
        </nav>
      </aside>
    </>
  )
}
