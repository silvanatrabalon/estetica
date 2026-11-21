import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/cn'
import { commonCopy } from '../lib/uiCopy'
import { roleLabel } from '../lib/adminUsersView'
import { isLastActiveAdminDeactivation } from '../lib/adminUserPolicies'
import {
  adminSetUserActive,
  listAdminUsers,
  type AdminManagedRole,
  type AdminManagedUser,
} from '../services/adminUsers'
import { ConfirmModal } from '../components/ConfirmModal'

type RoleFilter = 'all' | AdminManagedRole
type StatusFilter = 'all' | 'active' | 'inactive'

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: 'Administradores' },
  { value: 'staff', label: 'Staff' },
  { value: 'customer', label: 'Clientes' },
]

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
]

/** Simple directory: who is in the system, active or not. Roles and data live in the edit screen. */
export function AdminUsersPage() {
  const location = useLocation()
  const [users, setUsers] = useState<AdminManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { notice?: string } | null)?.notice ?? null,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [loadFailed, setLoadFailed] = useState(false)
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ isOpen: false, title: 'Confirmar', message: '', onConfirm: () => {} })

  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setConfirmState({ isOpen: true, title, message, onConfirm })
  const closeConfirm = () => setConfirmState((prev) => ({ ...prev, isOpen: false }))

  const activeAdminCount = useMemo(
    () => users.filter((u) => u.roles.includes('admin') && u.isActive).length,
    [users],
  )

  const roleCounts = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((u) => u.roles.includes('admin')).length,
      staff: users.filter((u) => u.roles.includes('staff')).length,
      customer: users.filter((u) => u.roles.includes('customer')).length,
    }),
    [users],
  )

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'all' && !u.roles.includes(roleFilter)) return false
      if (statusFilter === 'active' && !u.isActive) return false
      if (statusFilter === 'inactive' && u.isActive) return false
      if (!q) return true
      return u.name.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q)
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  const loadData = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    setLoadFailed(false)
    try {
      setUsers(await listAdminUsers())
    } catch {
      setLoadFailed(true)
      setErrorMessage('No pudimos cargar la gestión de usuarios en este momento.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleActivationToggle = (user: AdminManagedUser) => {
    const nextState = !user.isActive

    if (
      isLastActiveAdminDeactivation({
        roles: user.roles,
        isActive: user.isActive,
        nextIsActive: nextState,
        activeAdminCount,
      })
    ) {
      setErrorMessage('No podés desactivar al último administrador activo.')
      return
    }

    showConfirm(
      nextState ? 'Reactivar usuario' : 'Desactivar usuario',
      nextState ? '¿Confirmás reactivar este usuario?' : '¿Confirmás desactivar este usuario?',
      async () => {
        closeConfirm()
        setSuccessMessage(null)
        setErrorMessage(null)
        setBusyUserId(user.userId)
        try {
          const updated = await adminSetUserActive(user.userId, nextState)
          setUsers((current) =>
            current.map((item) =>
              item.userId === updated.user_id ? { ...item, isActive: updated.is_active } : item,
            ),
          )
          setSuccessMessage(
            updated.is_active ? 'Usuario reactivado correctamente.' : 'Usuario desactivado correctamente.',
          )
        } catch {
          setErrorMessage('No pudimos cambiar el estado del usuario. Verificá permisos o restricciones de seguridad.')
        } finally {
          setBusyUserId(null)
        }
      },
    )
  }

  const chipClass = (active: boolean) =>
    cn(
      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
      active
        ? 'border-brand-primary bg-brand-primary text-white'
        : 'border-shell-border bg-white text-shell-text hover:bg-shell-muted',
    )

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-shell-text">Usuarios y roles</h2>
        <p className="mt-1 text-sm text-shell-subtleText">
          Quién tiene cuenta y si está activa. Para cambiar los roles o los datos de alguien, usá “Editar roles”.
        </p>
      </div>

      {errorMessage ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p>{errorMessage}</p>
          {loadFailed ? (
            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              {commonCopy.retry}
            </button>
          ) : null}
        </div>
      ) : null}
      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <div className="shell-surface rounded-2xl border p-4 shadow-sm">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm text-shell-text placeholder:text-shell-subtleText focus:border-brand-primary focus:outline-none"
          aria-label="Buscar usuarios"
        />

        <div role="group" aria-label="Filtrar por rol" className="mt-3 flex flex-wrap gap-2">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={roleFilter === f.value}
              onClick={() => setRoleFilter(f.value)}
              className={chipClass(roleFilter === f.value)}
            >
              {f.label}
              <span className="opacity-70">{roleCounts[f.value]}</span>
            </button>
          ))}
        </div>

        <div role="group" aria-label="Filtrar por estado" className="mt-2 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
              className={chipClass(statusFilter === f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? <p className="mt-3 text-sm text-shell-subtleText">Cargando usuarios...</p> : null}
        {!isLoading && !loadFailed && users.length === 0 ? (
          <p className="mt-3 text-sm text-shell-subtleText">No hay usuarios disponibles para administrar.</p>
        ) : null}
        {!isLoading && users.length > 0 && filteredUsers.length === 0 ? (
          <p className="mt-3 text-sm text-shell-subtleText">No se encontraron usuarios con ese criterio.</p>
        ) : null}

        <ul className="mt-3 divide-y divide-shell-border">
          {filteredUsers.map((user) => (
            <li key={user.userId} className="py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-shell-text">{user.name || 'Usuario sin nombre'}</p>
                  <p className="truncate text-xs text-shell-subtleText">{user.email ?? user.userId}</p>
                  <p className="mt-0.5 text-xs text-shell-subtleText">{user.roles.map(roleLabel).join(', ')}</p>
                </div>
                <span
                  className={[
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
                    user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700',
                  ].join(' ')}
                >
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-4 text-xs font-semibold">
                <Link
                  to={`/admin/users/${user.userId}`}
                  aria-label={`Editar roles de ${user.name || user.email || 'usuario'}`}
                  className="text-brand-primary hover:underline"
                >
                  Editar roles
                </Link>
                <button
                  type="button"
                  disabled={busyUserId === user.userId}
                  onClick={() => handleActivationToggle(user)}
                  aria-label={`${user.isActive ? 'Desactivar' : 'Reactivar'} a ${user.name || user.email || 'usuario'}`}
                  className={[
                    'hover:underline disabled:opacity-60',
                    user.isActive ? 'text-red-500' : 'text-teal-700',
                  ].join(' ')}
                >
                  {user.isActive ? 'Desactivar' : 'Reactivar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
    </section>
  )
}
