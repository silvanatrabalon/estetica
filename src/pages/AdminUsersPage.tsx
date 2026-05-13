import { FormEvent, useEffect, useMemo, useState } from 'react'
import { normalizePhone, normalizeProfileName, validateProfileInput } from '../lib/profile'
import { commonCopy } from '../lib/uiCopy'
import {
  isLastActiveAdminDeactivation,
  isLastActiveAdminRoleDemotion,
  isSelfDemotion,
} from '../lib/adminUserPolicies'
import {
  adminAssignUserRole,
  adminRevokeUserRole,
  adminSetUserActive,
  adminUpdateUserProfile,
  getAdminUserAnalytics,
  listAdminUsers,
  type AdminManagedRole,
  type AdminManagedUser,
  type AdminUserAnalytics,
} from '../services/adminUsers'
import { useUser } from '../hooks/useUser'

function formatRelativeDate(dateValue: string | null): string {
  if (!dateValue) {
    return 'Sin registro'
  }

  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) {
    return 'Sin registro'
  }

  return parsed.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function roleLabel(role: AdminManagedRole): string {
  if (role === 'admin') return 'Administrador'
  if (role === 'staff') return 'Staff'
  return 'Cliente'
}

const ALL_ROLES: AdminManagedRole[] = ['customer', 'staff', 'admin']

export function AdminUsersPage() {
  const { user: currentUser } = useUser()
  const [users, setUsers] = useState<AdminManagedUser[]>([])
  const [analytics, setAnalytics] = useState<AdminUserAnalytics | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingRole, setIsSavingRole] = useState(false)
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)

  const selectedUser = useMemo(
    () => users.find((user) => user.userId === selectedUserId) ?? null,
    [users, selectedUserId],
  )

  const activeAdminCount = useMemo(
    () => users.filter((user) => user.roles.includes('admin') && user.isActive).length,
    [users],
  )

  const loadData = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [usersData, analyticsData] = await Promise.all([listAdminUsers(), getAdminUserAnalytics()])
      setUsers(usersData)
      setAnalytics(analyticsData)

      if (usersData.length > 0) {
        setSelectedUserId((current) => current || usersData[0].userId)
      } else {
        setSelectedUserId('')
      }
    } catch {
      setErrorMessage('No pudimos cargar la gestión de usuarios en este momento.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  useEffect(() => {
    if (!selectedUser) {
      setName('')
      setPhone('')
      setIsActive(true)
      return
    }

    setName(selectedUser.name)
    setPhone(selectedUser.phone ?? '')
    setIsActive(selectedUser.isActive)
  }, [selectedUser])

  const refreshAnalytics = async () => {
    try {
      const analyticsData = await getAdminUserAnalytics()
      setAnalytics(analyticsData)
    } catch {
      setErrorMessage('No pudimos actualizar la analítica de usuarios.')
    }
  }

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)
    setNameError(null)

    if (!selectedUser) {
      setErrorMessage('Seleccioná un usuario antes de guardar cambios.')
      return
    }

    const validation = validateProfileInput({ name, phone })
    if (!validation.valid) {
      setNameError(validation.errors.name ?? null)
      return
    }

    setIsSavingProfile(true)

    try {
      const updatedProfile = await adminUpdateUserProfile(selectedUser.userId, {
        name: normalizeProfileName(name),
        phone: normalizePhone(phone) ?? '',
      })

      setUsers((current) =>
        current.map((item) =>
          item.userId === updatedProfile.userId
            ? {
                ...item,
                name: updatedProfile.name,
                phone: updatedProfile.phone,
              }
            : item,
        ),
      )
      setSuccessMessage('Perfil de usuario actualizado correctamente.')
    } catch {
      setErrorMessage('No pudimos actualizar el perfil del usuario en este momento.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleRoleToggle = async (toggledRole: AdminManagedRole, shouldAssign: boolean) => {
    if (!selectedUser) {
      setErrorMessage('Seleccioná un usuario para cambiar sus roles.')
      return
    }

    const currentRoles = selectedUser.roles
    const nextRoles = shouldAssign
      ? [...new Set([...currentRoles, toggledRole])]
      : currentRoles.filter((r) => r !== toggledRole)

    // Must have at least one role
    if (nextRoles.length === 0) {
      setErrorMessage('El usuario debe tener al menos un rol asignado.')
      return
    }

    if (
      !shouldAssign &&
      (isSelfDemotion({
        actorUserId: currentUser?.id ?? null,
        targetUserId: selectedUser.userId,
        nextRoles,
      }) ||
        isLastActiveAdminRoleDemotion({
          currentRoles,
          nextRoles,
          isActive: selectedUser.isActive,
          activeAdminCount,
        }))
    ) {
      setErrorMessage('No podés aplicar ese cambio de rol por una restricción de seguridad.')
      return
    }

    const confirmChange = window.confirm(
      shouldAssign
        ? `¿Confirmás asignar el rol "${roleLabel(toggledRole)}" a este usuario?`
        : `¿Confirmás quitar el rol "${roleLabel(toggledRole)}" de este usuario?`,
    )
    if (!confirmChange) {
      return
    }

    setSuccessMessage(null)
    setErrorMessage(null)
    setIsSavingRole(true)

    try {
      if (shouldAssign) {
        await adminAssignUserRole(selectedUser.userId, toggledRole)
      } else {
        await adminRevokeUserRole(selectedUser.userId, toggledRole)
      }

      setUsers((current) =>
        current.map((item) =>
          item.userId === selectedUser.userId ? { ...item, roles: nextRoles } : item,
        ),
      )
      setSuccessMessage('Roles actualizados correctamente.')
      await refreshAnalytics()
    } catch {
      setErrorMessage('No pudimos actualizar el rol. Verificá permisos o restricciones de seguridad.')
    } finally {
      setIsSavingRole(false)
    }
  }

  const handleActivationToggle = async () => {
    if (!selectedUser) {
      setErrorMessage('Seleccioná un usuario para cambiar su estado.')
      return
    }

    const nextState = !isActive

    if (
      isLastActiveAdminDeactivation({
        roles: selectedUser.roles,
        isActive: selectedUser.isActive,
        nextIsActive: nextState,
        activeAdminCount,
      })
    ) {
      setErrorMessage('No podés desactivar al último administrador activo.')
      return
    }

    const confirmMessage = nextState
      ? '¿Confirmás reactivar este usuario?'
      : '¿Confirmás desactivar este usuario?'

    if (!window.confirm(confirmMessage)) {
      return
    }

    setSuccessMessage(null)
    setErrorMessage(null)
    setIsSavingStatus(true)

    try {
      const updated = await adminSetUserActive(selectedUser.userId, nextState)
      setUsers((current) =>
        current.map((item) =>
          item.userId === updated.user_id
            ? {
                ...item,
                isActive: updated.is_active,
              }
            : item,
        ),
      )
      setIsActive(updated.is_active)
      setSuccessMessage(updated.is_active ? 'Usuario reactivado correctamente.' : 'Usuario desactivado correctamente.')
      await refreshAnalytics()
    } catch {
      setErrorMessage('No pudimos cambiar el estado del usuario. Verificá permisos o restricciones de seguridad.')
    } finally {
      setIsSavingStatus(false)
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-shell-text">Usuarios</h2>
        <p className="mt-2 text-sm text-shell-subtleText">
          Gestión administrativa de usuarios: directorio, roles globales, activación y analítica operativa.
        </p>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{successMessage}</p>
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
            Admin: {analytics?.adminUsers ?? 0} · Staff: {analytics?.staffUsers ?? 0} · Clientes: {analytics?.customerUsers ?? 0}
          </p>
        </article>
        <article className="shell-surface rounded-xl border p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Altas (30 días)</p>
          <p className="mt-2 text-2xl font-semibold text-shell-text">{analytics?.recentSignups30Days ?? 0}</p>
        </article>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px)_1fr]">
        <aside className="shell-surface rounded-2xl border p-4 shadow-sm">
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

          {isLoading ? <p className="mt-3 text-sm text-shell-subtleText">Cargando usuarios...</p> : null}
          {!isLoading && users.length === 0 ? (
            <p className="mt-3 text-sm text-shell-subtleText">No hay usuarios disponibles para administrar.</p>
          ) : null}

          <ul className="mt-3 space-y-2">
            {users.map((user) => {
              const selected = user.userId === selectedUserId
              return (
                <li key={user.userId}>
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(user.userId)}
                    className={[
                      'w-full rounded-lg border px-3 py-2 text-left text-sm transition-micro',
                      selected
                        ? 'border-brand-primary bg-teal-50 text-shell-text'
                        : 'border-shell-border bg-white text-shell-subtleText hover:bg-shell-muted',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold">{user.name || 'Usuario sin nombre'}</p>
                      <span
                        className={[
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700',
                        ].join(' ')}
                      >
                        {user.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <p className="truncate text-xs">{user.email ?? user.userId}</p>
                    <p className="mt-1 text-xs">{user.roles.map(roleLabel).join(', ')}</p>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <div className="shell-surface rounded-2xl border p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-shell-text">Editar usuario seleccionado</h3>

          {!selectedUser ? (
            <p className="mt-4 text-sm text-shell-subtleText">Seleccioná un usuario para ver sus datos y acciones disponibles.</p>
          ) : (
            <>
              <div className="mt-4 grid gap-4 rounded-lg border border-shell-border p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Correo</p>
                  <p className="text-sm text-shell-text">{selectedUser.email ?? 'Sin correo visible'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Último acceso</p>
                  <p className="text-sm text-shell-text">{formatRelativeDate(selectedUser.lastSignInAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Alta</p>
                  <p className="text-sm text-shell-text">{formatRelativeDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Estado</p>
                  <p className="text-sm text-shell-text">{isActive ? 'Activo' : 'Inactivo'}</p>
                </div>
              </div>

              <form className="mt-5 space-y-4" onSubmit={handleProfileSubmit}>
                <div>
                  <label htmlFor="admin-profile-name" className="mb-1 block text-sm font-semibold text-shell-text">
                    {commonCopy.nameLabel}
                  </label>
                  <input
                    id="admin-profile-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-shell-text"
                  />
                  {nameError ? <p className="mt-1 text-xs text-red-600">{nameError}</p> : null}
                </div>

                <div>
                  <label htmlFor="admin-profile-phone" className="mb-1 block text-sm font-semibold text-shell-text">
                    {commonCopy.phoneOptionalLabel}
                  </label>
                  <input
                    id="admin-profile-phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-shell-text"
                  />
                </div>

                <div>
                  <p className="mb-1 block text-sm font-semibold text-shell-text">Roles asignados</p>
                  <div className="flex flex-wrap gap-3">
                    {ALL_ROLES.map((r) => {
                      const checked = selectedUser.roles.includes(r)
                      return (
                        <label
                          key={r}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-shell-border px-3 py-2 text-sm text-shell-text hover:bg-shell-muted"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isSavingRole}
                            onChange={(e) => void handleRoleToggle(r, e.target.checked)}
                            className="h-4 w-4 rounded accent-teal-600"
                          />
                          {roleLabel(r)}
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => void handleActivationToggle()}
                    disabled={isSavingStatus}
                    className="rounded-lg border border-shell-border px-4 py-2 text-sm font-semibold text-shell-text transition-micro hover:bg-shell-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingStatus ? commonCopy.saving : isActive ? 'Desactivar usuario' : 'Reactivar usuario'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-micro hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingProfile ? commonCopy.saving : 'Guardar perfil de usuario'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
