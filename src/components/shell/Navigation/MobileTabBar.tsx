import { Link, useLocation } from 'react-router-dom'
import { useShellContext } from '../../../features/shell/hooks/useShellContext'
import { cn } from '../../../lib/cn'

interface Tab {
  href: string
  label: string
  icon: string
}

// Icons are single 24px paths; labels carry the meaning.
const TABS: Tab[] = [
  { href: '/admin/dashboard', label: 'Inicio', icon: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { href: '/admin/appointments', label: 'Turnos', icon: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01' },
  { href: '/admin/calendar', label: 'Calendario', icon: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18' },
]

/** Phone-only quick links for the admin. "Más" opens the full menu drawer. */
export function MobileTabBar() {
  const { pathname } = useLocation()
  const { isMobileMenuOpen, toggleMobileMenu } = useShellContext()

  const itemCls = 'flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-bold'

  return (
    <nav
      aria-label="Accesos rápidos"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-shell-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            to={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(itemCls, active ? 'text-shell-text' : 'text-shell-subtleText')}
          >
            <span
              className={cn(
                'flex h-8 w-14 items-center justify-center rounded-full',
                active && 'bg-[var(--color-lilac)]',
              )}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={tab.icon} />
              </svg>
            </span>
            {tab.label}
          </Link>
        )
      })}
      <button
        type="button"
        onClick={toggleMobileMenu}
        aria-expanded={isMobileMenuOpen}
        aria-controls="primary-sidebar"
        className={cn(itemCls, 'text-shell-subtleText')}
      >
        <span className={cn('flex h-8 w-14 items-center justify-center rounded-full', isMobileMenuOpen && 'bg-[var(--color-lilac)]')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </span>
        Más
      </button>
    </nav>
  )
}
