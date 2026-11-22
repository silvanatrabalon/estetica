import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '../lib/cn'
import { commonCopy } from '../lib/uiCopy'
import { roleLabel } from '../lib/adminUsersView'
import { isLastActiveAdminDeactivation } from '../lib/adminUserPolicies'
import {
  adminDeleteUserInvitation,
  adminInviteUser,
  adminListUserInvitations,
  adminSetUserActive,
  listAdminUsers,
  type AdminManagedRole,
  type AdminManagedUser,
  type UserInvitation,
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

  // Add a user before they have signed in
  const [invitations, setInvitations] = useState<UserInvitation[]>([])
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRoles, setInviteRoles] = useState<AdminManagedRole[]>(['customer'])
  const [isInviting, setIsInviting] = useState(false)
  const [existingUserId, setExistingUserId] = useState<string | null>(null)
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
      setInvitations(await adminListUserInvitations().catch(() => []))
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

  const openInvite = () => {
    setIsInviteOpen(true)
    setInviteEmail('')
    setInviteName('')
    setInviteRoles(['customer'])
    setExistingUserId(null)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const toggleInviteRole = (role: AdminManagedRole) =>
    setInviteRoles((current) => (current.includes(role) ? current.filter((r) => r !== role) : [...current, role]))

  const handleInviteSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    setExistingUserId(null)

    if (inviteRoles.length === 0) {
      setErrorMessage('Elegí al menos un rol.')
      return
    }

    setIsInviting(true)
    try {
      const result = await adminInviteUser(inviteEmail, inviteName, inviteRoles)
      if (result.status === 'exists') {
        setExistingUserId(result.userId)
        setErrorMessage('Ese email ya tiene cuenta. Para cambiar sus roles usá "Editar roles".')
        return
      }
      setInvitations(await adminListUserInvitations().catch(() => invitations))
      setSuccessMessage(`Listo. Cuando ${inviteEmail.trim().toLowerCase()} entre a la app, ya tiene sus roles.`)
      setIsInviteOpen(false)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No pudimos guardar la invitación.')
    } finally {
      setIsInviting(false)
    }
  }

  const handleDeleteInvitation = (invitation: UserInvitation) => {
    showConfirm(
      'Quitar invitación',
      `¿Quitás la invitación de ${invitation.email}? Si tenía el rol de staff, también se quita su ficha de profesional (salvo que ya tenga turnos).`,
      async () => {
        closeConfirm()
        setErrorMessage(null)
        setSuccessMessage(null)
        try {
          await adminDeleteUserInvitation(invitation.id)
          setInvitations((current) => current.filter((i) => i.id !== invitation.id))
          setSuccessMessage('Invitación quitada.')
        } catch (err) {
          setErrorMessage(err instanceof Error ? err.message : 'No pudimos quitar la invitación.')
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
      <div className="flex items-start justify-between gap-3">
        <div>
        <h2 className="font-heading text-2xl font-semibold text-shell-text">Usuarios y roles</h2>
        <p className="mt-1 text-sm text-shell-subtleText">
          Quién tiene cuenta y si está activa. Para cambiar los roles o los datos de alguien, usá “Editar roles”.
        </p>
        </div>
        {!isInviteOpen && (
          <button
            type="button"
            onClick={openInvite}
            className="shrink-0 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            + Agregar usuario
          </button>
        )}
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

      {existingUserId && (
        <p className="text-sm">
          <Link to={`/admin/users/${existingUserId}`} className="font-semibold text-brand-primary hover:underline">
            Ir a Editar roles de esa cuenta
          </Link>
        </p>
      )}

      {isInviteOpen && (
        <form
          onSubmit={(e) => void handleInviteSubmit(e)}
          noValidate
          className="shell-surface space-y-3 rounded-2xl border p-4 shadow-sm"
        >
          <h3 className="text-base font-semibold text-shell-text">Agregar usuario</h3>
          <p className="text-sm text-shell-subtleText">
            Cuando esa persona entre a la app con este email, ya va a tener los roles que elijas.
          </p>
          <div>
            <label htmlFor="invite-email" className="mb-1 block text-sm font-medium text-shell-text">
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm text-shell-text focus:border-brand-primary focus:outline-none"
              placeholder="persona@gmail.com"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="invite-name" className="mb-1 block text-sm font-medium text-shell-text">
              Nombre <span className="font-normal text-shell-subtleText">(opcional)</span>
            </label>
            <input
              id="invite-name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm text-shell-text focus:border-brand-primary focus:outline-none"
              autoComplete="off"
            />
          </div>
          <fieldset>
            <legend className="mb-1 text-sm font-medium text-shell-text">Roles</legend>
            <div className="flex flex-wrap gap-2">
              {(['admin', 'staff', 'customer'] as const).map((role) => (
                <label
                  key={role}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-shell-border px-3 py-2 text-sm text-shell-text hover:bg-shell-muted"
                >
                  <input
                    type="checkbox"
                    checked={inviteRoles.includes(role)}
                    onChange={() => toggleInviteRole(role)}
                    className="h-4 w-4 rounded accent-teal-600"
                  />
                  {roleLabel(role)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isInviting}
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isInviting ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="rounded-lg border border-shell-border px-4 py-2 text-sm font-medium text-shell-text hover:bg-shell-muted"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {invitations.length > 0 && (
        <section aria-label="Invitaciones pendientes" className="shell-surface rounded-2xl border p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-shell-text">Invitaciones pendientes</h3>
          <ul className="divide-y divide-shell-border">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-shell-text">{invitation.name || invitation.email}</p>
                  {invitation.name && <p className="truncate text-xs text-shell-subtleText">{invitation.email}</p>}
                  <p className="text-xs text-shell-subtleText">{invitation.roles.map(roleLabel).join(', ')}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs font-semibold">
                  <span className="rounded-full bg-[var(--color-peach)] px-2 py-0.5 text-[11px] text-[var(--color-peach-ink)]">
                    Invitación pendiente
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteInvitation(invitation)}
                    aria-label={`Quitar la invitación de ${invitation.email}`}
                    className="text-red-500 hover:underline"
                  >
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

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
