import { useState } from 'react'
import { useUser } from '../../hooks/useUser'
import type { AppRole } from '../../context/UserContext'

const roles: AppRole[] = ['customer', 'staff', 'admin']

const roleColors: Record<AppRole, string> = {
  admin: 'bg-red-600',
  staff: 'bg-amber-500',
  customer: 'bg-blue-600',
}

function DevRoleBadgeInner() {
  const { activeRole: role } = useUser()
  const [open, setOpen] = useState(false)
  const stored = localStorage.getItem('__dev_role_override__') as AppRole | null
  if (!stored) return null

  const color = roleColors[stored] ?? 'bg-gray-600'

  function switchRole(r: AppRole) {
    window.location.href = `/?devRole=${r}`
  }

  function deactivate() {
    window.location.href = '/?devRole=off'
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1">
      {open && (
        <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-gray-900 p-2 shadow-xl">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => switchRole(r)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity ${roleColors[r]} ${r === stored ? 'opacity-100 ring-2 ring-white/40' : 'opacity-60 hover:opacity-100'}`}
            >
              {r === stored && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              {r}
            </button>
          ))}
          <button
            onClick={deactivate}
            className="mt-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            desactivar override
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-opacity hover:opacity-90 ${color}`}
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/70" />
        DEV · {role ?? stored}
        <span className="ml-1 opacity-70">{open ? '▲' : '▼'}</span>
      </button>
    </div>
  )
}

export function DevRoleBadge() {
  if (!import.meta.env.DEV) return null
  return <DevRoleBadgeInner />
}
