import { Link } from 'react-router-dom'
import type { NavItem } from '../../../features/shell/types'
import { cn } from '../../../lib'

interface NavLinkProps {
  item: NavItem
  isActive?: boolean
  onNavigate?: () => void
}

export function NavLink({ item, isActive = false, onNavigate }: NavLinkProps) {
  return (
    <Link
      to={item.href}
      aria-current={isActive ? 'page' : undefined}
      onClick={() => onNavigate?.()}
      className={cn(
        'transition-micro flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
        'focus-visible:scale-[1.01] focus-visible:bg-shell-muted',
        'hover:scale-[1.01] hover:bg-shell-muted',
        isActive
          ? 'bg-[var(--color-lilac)] font-semibold text-shell-text'
          : 'text-shell-subtleText'
      )}
    >
      {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
      <span className="flex-1">{item.label}</span>
    </Link>
  )
}
