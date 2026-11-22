import { Link, useLocation } from 'react-router-dom'
import { useShellContext } from '../../../features/shell/hooks/useShellContext'
import { cn } from '../../../lib/cn'

export interface MobileTab {
  href: string
  label: string
  /** Single 24px SVG path */
  icon: string
}

const ICON = {
  home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  calendar: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18',
  calendarPlus: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18M12 13v6M9 16h6',
  clock: 'M12 7v5l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
}

// Labels match the side menu so the same thing is never called two names.
export const ADMIN_TABS: MobileTab[] = [
  { href: '/admin/dashboard', label: 'Inicio', icon: ICON.home },
  { href: '/admin/appointments', label: 'Turnos', icon: ICON.calendar },
  { href: '/admin/services', label: 'Servicios', icon: ICON.tag },
]

export const CUSTOMER_TABS: MobileTab[] = [
  { href: '/dashboard', label: 'Inicio', icon: ICON.home },
  { href: '/booking', label: 'Reservar', icon: ICON.calendarPlus },
  { href: '/appointments', label: 'Mis turnos', icon: ICON.list },
]

export const STAFF_TABS: MobileTab[] = [
  { href: '/dashboard', label: 'Inicio', icon: ICON.home },
  { href: '/staff/appointments', label: 'Turnos', icon: ICON.calendar },
  { href: '/staff/schedule', label: 'Disponibilidad', icon: ICON.clock },
]

/** Phone-only quick links for a role. "Más" opens the full menu drawer. */
export function MobileTabBar({ tabs }: { tabs: MobileTab[] }) {
  const { pathname } = useLocation()
  const { isMobileMenuOpen, toggleMobileMenu } = useShellContext()

  const itemCls = 'flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-bold'

  return (
    <nav
      aria-label="Accesos rápidos"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-shell-border bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {tabs.map((tab) => {
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
