import type { NavItem } from '../../../features/shell/types'
import { cn } from '../../../lib'

interface NavLinkProps {
  item: NavItem
  isActive?: boolean
  onNavigate?: () => void
}

export function NavLink({ item, isActive = false, onNavigate }: NavLinkProps) {
  const handleClick = () => {
    onNavigate?.()
    // Navigate using standard anchor href
    window.location.href = item.href
  }

  return (
    <a
      href={item.href}
      onClick={(e) => {
        e.preventDefault()
        handleClick()
      }}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200',
        'text-sm font-medium cursor-pointer',
        'hover:bg-gray-100 hover:scale-[1.02]',
        isActive
          ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
          : 'text-gray-700 border-l-4 border-transparent'
      )}
    >
      {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
      <span className="flex-1">{item.label}</span>
    </a>
  )
}
