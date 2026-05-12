import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { useUser } from '../../../hooks/useUser'

interface UserMenuProps {
  user: User
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { signOut, profile } = useUser()
  const navigate = useNavigate()
  const menuId = 'user-menu-panel'

  const fallbackName = user.email?.split('@')[0] ?? 'Usuario'
  const displayName = profile?.name.trim().length ? profile.name : fallbackName

  const handleLogout = async () => {
    try {
      await signOut()
      setIsOpen(false)
      navigate('/signin', { replace: true })
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const userInitials = displayName
    ? displayName
        .split('.')
        .join(' ')
        .split(' ')
        .filter(Boolean)
        .map((part: string) => part[0].toUpperCase())
        .join('')
        .slice(0, 2)
    : 'U'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="transition-micro flex items-center gap-2 rounded-xl border border-transparent p-2 hover:border-shell-border hover:bg-shell-muted"
        title={displayName}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
      >
        {/* Avatar circle */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white">
          {userInitials}
        </div>
        {/* User name (hidden on mobile) */}
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-shell-subtleText sm:inline">
          {displayName}
        </span>
      </button>

      {/* Dropdown menu */}
      <div
        id={menuId}
        role="menu"
        aria-hidden={!isOpen}
        className={[
          'shell-surface transition-micro absolute right-0 z-50 mt-2 w-52 rounded-xl border shadow-shell',
          isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
        ].join(' ')}
      >
        <Link
          to="/profile"
          role="menuitem"
          onClick={() => setIsOpen(false)}
          className="transition-micro block w-full rounded-t-xl px-4 py-2.5 text-left text-sm text-shell-subtleText hover:bg-shell-muted"
        >
          Perfil
        </Link>
        <button
          onClick={handleLogout}
          role="menuitem"
          className="transition-micro w-full rounded-b-xl border-t border-shell-border px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Backdrop to close menu */}
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú de usuario"
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
