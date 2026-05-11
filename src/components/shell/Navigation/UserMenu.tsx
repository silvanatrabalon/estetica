import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useUser } from '../../../hooks/useUser'

interface UserMenuProps {
  user: User
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { signOut } = useUser()

  const handleLogout = async () => {
    try {
      await signOut()
      setIsOpen(false)
      window.location.href = '/' // Redirect to login/home
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const userInitials = user.email
    ? user.email
        .split('@')[0]
        .split('.')
        .map((part) => part[0].toUpperCase())
        .join('')
        .slice(0, 2)
    : 'U'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title={user.email || 'User'}
      >
        {/* Avatar circle */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold">
          {userInitials}
        </div>
        {/* User email (hidden on mobile) */}
        <span className="text-sm font-medium text-gray-700 hidden sm:inline max-w-[120px] truncate">
          {user.email?.split('@')[0]}
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <a
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t-lg"
          >
            Profile
          </a>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors last:rounded-b-lg border-t border-gray-200"
          >
            Logout
          </button>
        </div>
      )}

      {/* Backdrop to close menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
