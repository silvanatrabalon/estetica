import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
import {
  adminLinkStaffMember,
  listAdminStaffMembers,
  listLinkedStaffUserIds,
  type AdminStaffMember,
} from '../services/adminStaff'
import { LinkAccountModal } from '../components/admin/LinkAccountModal'
import { listBookingClients, type BookingClient } from '../services/bookingClients'
import { ConfirmModal } from '../components/ConfirmModal'
import { FilterMenu } from '../components/FilterMenu'

type RoleFilter = 'all' | AdminManagedRole
/** 'noaccount': people that have no account yet (invited, professionals and clients loaded by name). */
type StatusFilter = 'all' | 'active' | 'inactive' | 'noaccount'

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
  { value: 'noaccount', label: 'Sin cuenta' },
]

/** Simple directory: who is in the system, active or not. Roles and data live in the edit screen. */
export function AdminUsersPage() {
  const location = useLocation()
  const navigate = useNavigate()
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
  // People without account: professionals (they can be linked) and clients loaded by name
  const [staffNoAccount, setStaffNoAccount] = useState<AdminStaffMember[]>([])
  const [clientsNoAccount, setClientsNoAccount] = useState<BookingClient[]>([])
  // Accounts that already belong to a professional (even one that the Profesionales list hides)
  const [linkedUserIds, setLinkedUserIds] = useState<string[]>([])
  // Pop-up to link an account to a professional
  const [linkTarget, setLinkTarget] = useState<AdminStaffMember | null>(null)
  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

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
    confirmLabel?: string
    cancelLabel?: string
  }>({ isOpen: false, title: 'Confirmar', message: '', onConfirm: () => {} })

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    labels?: { confirmLabel?: string; cancelLabel?: string },
  ) => setConfirmState({ isOpen: true, title, message, onConfirm, ...labels })
  const closeConfirm = () => setConfirmState((prev) => ({ ...prev, isOpen: false }))

  const activeAdminCount = useMemo(
    () => users.filter((u) => u.roles.includes('admin') && u.isActive).length,
    [users],
  )

  // People without account: invited by email (any role, admin included), professionals and clients loaded by name
  const roleCounts = useMemo(
    () => ({
      all: users.length + invitations.length + staffNoAccount.length + clientsNoAccount.length,
      admin:
        users.filter((u) => u.roles.includes('admin')).length +
        invitations.filter((i) => i.roles.includes('admin')).length,
      staff:
        users.filter((u) => u.roles.includes('staff')).length +
        invitations.filter((i) => i.roles.includes('staff')).length +
        staffNoAccount.length,
      customer:
        users.filter((u) => u.roles.includes('customer')).length +
        invitations.filter((i) => i.roles.includes('customer')).length +
        clientsNoAccount.length,
    }),
    [users, invitations, staffNoAccount, clientsNoAccount],
  )

  const q = searchQuery.trim().toLowerCase()
  const matches = (...texts: Array<string | null | undefined>) =>
    !q || texts.some((t) => (t ?? '').toLowerCase().includes(q))
  // People without account have no active/inactive state: they show with "Todos" and "Sin cuenta" only
  const showNoAccount = statusFilter === 'all' || statusFilter === 'noaccount'

  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
        if (statusFilter === 'noaccount') return false
        if (roleFilter !== 'all' && !u.roles.includes(roleFilter)) return false
        if (statusFilter === 'active' && !u.isActive) return false
        if (statusFilter === 'inactive' && u.isActive) return false
        return matches(u.name, u.email)
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users, searchQuery, roleFilter, statusFilter],
  )
  const visibleInvitations = showNoAccount
    ? invitations.filter((i) => (roleFilter === 'all' || i.roles.includes(roleFilter)) && matches(i.name, i.email))
    : []
  const visibleStaffNoAccount =
    showNoAccount && (roleFilter === 'all' || roleFilter === 'staff')
      ? staffNoAccount.filter((m) => matches(m.displayName, m.inviteEmail))
      : []
  const visibleClientsNoAccount =
    showNoAccount && (roleFilter === 'all' || roleFilter === 'customer')
      ? clientsNoAccount.filter((c) => matches(c.name, c.email, c.phone))
      : []
  // How many people without account the chosen role has (shown in the Estado menu)
  const noAccountCount =
    invitations.filter((i) => roleFilter === 'all' || i.roles.includes(roleFilter)).length +
    (roleFilter === 'all' || roleFilter === 'staff' ? staffNoAccount.length : 0) +
    (roleFilter === 'all' || roleFilter === 'customer' ? clientsNoAccount.length : 0)
  const totalVisible =
    filteredUsers.length + visibleInvitations.length + visibleStaffNoAccount.length + visibleClientsNoAccount.length

  const loadData = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    setLoadFailed(false)
    try {
      setUsers(await listAdminUsers())
      setInvitations(await adminListUserInvitations().catch(() => []))
      // Non-critical: without these the "Sin cuenta" filter just shows nothing
      const [staff, clients, linkedIds] = await Promise.all([
        listAdminStaffMembers().catch(() => [] as AdminStaffMember[]),
        listBookingClients().catch(() => [] as BookingClient[]),
        listLinkedStaffUserIds().catch(() => [] as string[]),
      ])
      setLinkedUserIds([...new Set([...linkedIds, ...staff.flatMap((m) => (m.profileUserId ? [m.profileUserId] : []))])])
      setStaffNoAccount(staff.filter((m) => m.profileUserId === null))
      setClientsNoAccount(clients.filter((c) => c.kind === 'guest'))
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

  // The pop-up always starts from what the server says right now, not from what this page loaded earlier
  const openLinkPopup = (member: AdminStaffMember) => {
    setLinkError(null)
    setLinkTarget(member)
    void listLinkedStaffUserIds()
      .then((ids) => setLinkedUserIds(ids))
      .catch(() => {
        // Keep what is already known
      })
  }

  const handleLink = async (userId: string) => {
    if (!linkTarget || !userId) return
    const professional = linkTarget
    const account = users.find((u) => u.userId === userId)
    setIsLinking(true)
    setLinkError(null)
    try {
      await adminLinkStaffMember(professional.id, userId)
      setLinkTarget(null)
      const accountName = account?.name || account?.email
      setSuccessMessage(
        accountName
          ? `Cuenta vinculada: ${professional.displayName} ahora usa la cuenta de ${accountName}.`
          : 'Cuenta vinculada.',
      )
      await loadData()
      showConfirm(
        'Profesional vinculado',
        `¿Querés ir a Profesionales para configurar a ${professional.displayName} (disponibilidad y servicios)?`,
        () => {
          closeConfirm()
          navigate('/admin/staff')
        },
        { confirmLabel: 'Ir a Profesionales', cancelLabel: 'Ahora no' },
      )
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'No pudimos vincular la cuenta. Intentá de nuevo.')
      // The list was out of date (that account was taken meanwhile): refresh it so it is not offered again
      void loadData()
    } finally {
      setIsLinking(false)
    }
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


  return (
    <section className="space-y-3 sm:space-y-4">
      <div>
        <h2 className="font-heading text-xl font-semibold text-shell-text sm:text-2xl">Usuarios y roles</h2>
        {/* The explanation only where there is room; on phones it pushed the list far down */}
        <p className="mt-1 hidden text-sm text-shell-subtleText sm:block">
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

      <div className="shell-surface rounded-2xl border p-3 shadow-sm sm:p-4">
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="min-w-0 flex-1 rounded-lg border border-shell-border bg-white px-3 py-1.5 text-sm text-shell-text placeholder:text-shell-subtleText focus:border-brand-primary focus:outline-none sm:py-2"
            aria-label="Buscar usuarios"
          />
          {!isInviteOpen && (
            <button
              type="button"
              onClick={openInvite}
              className="shrink-0 rounded-lg bg-brand-primary px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:py-2"
            >
              + Agregar{' '}
              <span className="hidden sm:inline">usuario</span>
            </button>
          )}
        </div>

        {/* Filters as drop-downs, so they take one row instead of several */}
        <div className="mt-2 flex items-center gap-2 sm:mt-3">
          <FilterMenu
            label="Filtrar por rol"
            options={ROLE_FILTERS.map((f) => ({ value: f.value, label: `${f.label} (${roleCounts[f.value]})` }))}
            value={roleFilter}
            onSelect={(value) => setRoleFilter(value as RoleFilter)}
            active={roleFilter !== 'all'}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
            </svg>
            {ROLE_FILTERS.find((f) => f.value === roleFilter)?.label}
            <span aria-hidden="true" className="text-xs text-shell-subtleText">▾</span>
          </FilterMenu>
          <FilterMenu
            label="Filtrar por estado"
            options={STATUS_FILTERS.map((f) => ({
              value: f.value,
              label: f.value === 'noaccount' ? `${f.label} (${noAccountCount})` : f.label,
            }))}
            value={statusFilter}
            onSelect={(value) => setStatusFilter(value as StatusFilter)}
            active={statusFilter !== 'all'}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
            </svg>
            {statusFilter === 'all' ? 'Estado' : STATUS_FILTERS.find((f) => f.value === statusFilter)?.label}
            <span aria-hidden="true" className="text-xs text-shell-subtleText">▾</span>
          </FilterMenu>
        </div>

        {isLoading ? <p className="mt-3 text-sm text-shell-subtleText">Cargando usuarios...</p> : null}
        {!isLoading && !loadFailed && roleCounts.all === 0 ? (
          <p className="mt-3 text-sm text-shell-subtleText">No hay usuarios disponibles para administrar.</p>
        ) : null}
        {!isLoading && roleCounts.all > 0 && totalVisible === 0 ? (
          <p className="mt-3 text-sm text-shell-subtleText">No se encontraron usuarios con ese criterio.</p>
        ) : null}

        <ul className="mt-2 divide-y divide-shell-border sm:mt-3">
          {filteredUsers.map((user) => (
            <li key={user.userId} className="py-2.5 sm:py-3">
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

          {visibleInvitations.map((invitation) => (
            <li key={`inv-${invitation.id}`} className="py-2.5 sm:py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-shell-text">{invitation.name || invitation.email}</p>
                  {invitation.name && <p className="truncate text-xs text-shell-subtleText">{invitation.email}</p>}
                  <p className="mt-0.5 text-xs text-shell-subtleText">{invitation.roles.map(roleLabel).join(', ')}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--color-peach)] px-2 py-0.5 text-xs font-semibold text-[var(--color-peach-ink)]">
                  Invitación pendiente
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs font-semibold">
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

          {visibleStaffNoAccount.map((member) => (
            <li key={`staff-${member.id}`} className="py-2.5 sm:py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-shell-text">{member.displayName}</p>
                  <p className="truncate text-xs text-shell-subtleText">
                    {member.inviteEmail ? `Se vincula sola cuando entre con ${member.inviteEmail}` : 'Sin email guardado'}
                  </p>
                  <p className="mt-0.5 text-xs text-shell-subtleText">Staff</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  Sin cuenta
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => openLinkPopup(member)}
                  aria-label={`Vincular cuenta a ${member.displayName}`}
                  className="text-brand-primary hover:underline"
                >
                  Vincular cuenta
                </button>
              </div>
            </li>
          ))}

          {visibleClientsNoAccount.map((client, index) => (
            <li key={`client-${client.name}-${client.email ?? ''}-${index}`} className="py-2.5 sm:py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-shell-text">{client.name || 'Sin nombre'}</p>
                  <p className="truncate text-xs text-shell-subtleText">
                    {[client.email, client.phone].filter(Boolean).join(' · ') || 'Sin email ni teléfono'}
                  </p>
                  <p className="mt-0.5 text-xs text-shell-subtleText">Cliente</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  Sin cuenta
                </span>
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
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        onCancel={closeConfirm}
      />

      <LinkAccountModal
        staffName={linkTarget?.displayName ?? null}
        accounts={users}
        linkedUserIds={linkedUserIds}
        isSaving={isLinking}
        error={linkError}
        onCancel={() => setLinkTarget(null)}
        onSave={(userId) => void handleLink(userId)}
      />
    </section>
  )
}
