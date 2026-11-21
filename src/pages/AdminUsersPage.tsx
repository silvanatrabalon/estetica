import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { commonCopy } from '../lib/uiCopy'
import { roleLabel } from '../lib/adminUsersView'
import { isLastActiveAdminDeactivation } from '../lib/adminUserPolicies'
import {
  adminSetUserActive,
  getAdminUserAnalytics,
  listAdminUsers,
  type AdminManagedUser,
  type AdminUserAnalytics,
} from '../services/adminUsers'
import { ConfirmModal } from '../components/ConfirmModal'

/** Simple directory: who is in the system, active or not. Roles and data live in the edit screen. */
export function AdminUsersPage() {
  const location = useLocation()
  const [users, setUsers] = useState<AdminManagedUser[]>([])
  const [analytics, setAnalytics] = useState<AdminUserAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { notice?: string } | null)?.notice ?? null,
  )
  const [searchQuery, setSearchQuery] = useState('')
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

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q),
    )
  }, [users, searchQuery])

  const loadData = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [usersData, analyticsData] = await Promise.all([listAdminUsers(), getAdminUserAnalytics()])
      setUsers(usersData)
      setAnalytics(analyticsData)
    } catch {
      setErrorMessage('No pudimos cargar la gestión de usuarios en este momento.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const refreshAnalytics = async () => {
    try {
      setAnalytics(await getAdminUserAnalytics())
    } catch {
      setErrorMessage('No pudimos actualizar la analítica de usuarios.')
    }
  }

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
          await refreshAnalytics()
        } catch {
          setErrorMessage('No pudimos cambiar el estado del usuario. Verificá permisos o restricciones de seguridad.')
        } finally {
          setBusyUserId(null)
        }
      },
    )
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-shell-text">Usuarios y roles</h2>
        <p className="mt-2 text-sm text-shell-subtleText">
          Quién tiene cuenta y si está activa. Para cambiar los roles o los datos de alguien, usá “Editar roles”.
        </p>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="shell-surface rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Total usuarios</p>
          <p className="mt-2 text-2xl font-semibold text-shell-text">{analytics?.totalUsers ?? 0}</p>
        </article>
        <article className="shell-surface rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Activos / Inactivos</p>
          <p className="mt-2 text-2xl font-semibold text-shell-text">
            {analytics?.activeUsers ?? 0} / {analytics?.inactiveUsers ?? 0}
          </p>
        </article>
        <article className="shell-surface rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Distribución por rol</p>
          <p className="mt-2 text-sm text-shell-text">
            Admin: {analytics?.adminUsers ?? 0} · Staff: {analytics?.staffUsers ?? 0} · Clientes:{' '}
            {analytics?.customerUsers ?? 0}
          </p>
        </article>
        <article className="shell-surface rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Nuevos (30 días)</p>
          <p className="mt-2 text-2xl font-semibold text-shell-text">{analytics?.recentSignups30Days ?? 0}</p>
        </article>
      </section>

      <div className="shell-surface rounded-2xl border p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-shell-text">Directorio de usuarios</h3>
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-lg border border-shell-border px-2 py-1 text-xs font-semibold text-shell-text transition-micro hover:bg-shell-muted"
          >
            {commonCopy.retry}
          </button>
        </div>

        <div className="mt-3">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm text-shell-text placeholder:text-shell-subtleText focus:border-brand-primary focus:outline-none"
            aria-label="Buscar usuarios"
          />
        </div>

        {isLoading ? <p className="mt-3 text-sm text-shell-subtleText">Cargando usuarios...</p> : null}
        {!isLoading && users.length === 0 ? (
          <p className="mt-3 text-sm text-shell-subtleText">No hay usuarios disponibles para administrar.</p>
        ) : null}
        {!isLoading && users.length > 0 && filteredUsers.length === 0 ? (
          <p className="mt-3 text-sm text-shell-subtleText">No se encontraron usuarios con ese criterio.</p>
        ) : null}

        <ul className="mt-3 divide-y divide-shell-border">
          {filteredUsers.map((user) => (
            <li
              key={user.userId}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-shell-text">{user.name || 'Usuario sin nombre'}</p>
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700',
                    ].join(' ')}
                  >
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="truncate text-xs text-shell-subtleText">{user.email ?? user.userId}</p>
                <p className="mt-0.5 text-xs text-shell-subtleText">{user.roles.map(roleLabel).join(', ')}</p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  to={`/admin/users/${user.userId}`}
                  aria-label={`Editar roles de ${user.name || user.email || 'usuario'}`}
                  className="rounded-lg border border-shell-border px-3 py-1.5 text-xs font-semibold text-shell-text hover:bg-shell-muted"
                >
                  Editar roles
                </Link>
                <button
                  type="button"
                  disabled={busyUserId === user.userId}
                  onClick={() => handleActivationToggle(user)}
                  aria-label={`${user.isActive ? 'Desactivar' : 'Reactivar'} a ${user.name || user.email || 'usuario'}`}
                  className={[
                    'rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60',
                    user.isActive
                      ? 'border-red-200 text-red-500 hover:bg-red-50'
                      : 'border-teal-200 text-teal-600 hover:bg-teal-50',
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
