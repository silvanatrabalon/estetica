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
        'transition-micro flex cursor-pointer items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-medium',
        'focus-visible:scale-[1.01] focus-visible:bg-shell-muted',
        'hover:scale-[1.01] hover:bg-shell-muted',
        isActive
          ? 'border-brand-primary bg-shell-muted text-brand-strong'
          : 'border-transparent text-shell-subtleText'
      )}
    >
      {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
      <span className="flex-1">{item.label}</span>
    </Link>
  )
}
