import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  adminCreateStaffMember,
  adminCreateStaffWithoutAccount,
  adminLinkStaffMember,
  adminRenameStaffMember,
  adminSetStaffActive,
  listAdminStaffMembers,
  listLinkedStaffUserIds,
  type AdminStaffMember,
} from '../services/adminStaff'
import { listAdminUsers, type AdminManagedRole, type AdminManagedUser } from '../services/adminUsers'
import { roleLabel } from '../lib/adminUsersView'
import { ConfirmModal } from '../components/ConfirmModal'
import { AccountPicker } from '../components/admin/AccountPicker'

/** 'account': new professional from an account. 'guest': new one without account. 'link' / 'rename': act on one. */
type FormMode = 'account' | 'guest' | 'link' | 'rename' | null

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
}

interface StaffMemberCardProps {
  member: AdminStaffMember
  onToggleActive: (member: AdminStaffMember) => void
  onNavigate: (path: string) => void
  onLink: (member: AdminStaffMember) => void
  onRename: (member: AdminStaffMember) => void
  /** All roles of the linked user (from the users directory) */
  roles?: AdminManagedRole[]
}

function StaffMemberCard({
  member,
  onToggleActive,
  onNavigate,
  onLink,
  onRename,
  roles,
}: StaffMemberCardProps) {
  const hasAccount = member.profileUserId !== null
  const initials = getInitials(member.displayName)
  // Highest role first; fall back to the single role from the staff list if the user is unknown
  const roleOrder: AdminManagedRole[] = ['admin', 'staff', 'customer']
  const shownRoles = roleOrder.filter((r) => (roles && roles.length > 0 ? roles : [member.role]).includes(r))

  return (
    <div
      className={`shell-surface rounded-2xl border p-4 shadow-sm transition-opacity ${
        !member.isActive ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full font-heading text-sm font-bold ${
            member.isActive ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading font-semibold leading-tight text-shell-text">{member.displayName}</p>
          {member.fullName && member.fullName !== member.displayName && (
            <p className="truncate text-xs text-shell-subtleText">{member.fullName}</p>
          )}
          {hasAccount ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {shownRoles.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-shell-muted px-1.5 py-0.5 text-[11px] font-medium text-shell-subtleText"
                >
                  {roleLabel(r)}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span className="rounded-full bg-[var(--color-peach)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-peach-ink)]">
                Sin cuenta
              </span>
              {member.inviteEmail && (
                <span className="truncate text-[11px] text-shell-subtleText">Invitación: {member.inviteEmail}</span>
              )}
            </div>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {member.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onNavigate(`/admin/staff/${member.id}/availability`)}
          className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Disponibilidad
        </button>
        <button
          type="button"
          onClick={() => onNavigate(`/admin/staff/${member.id}/services`)}
          className="rounded-lg border border-shell-border bg-white px-3 py-2 text-sm font-medium text-shell-text transition-colors hover:bg-shell-muted"
        >
          Servicios
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
        {hasAccount ? (
          <button
            type="button"
            onClick={() => onNavigate(`/admin/users/${member.profileUserId}`)}
            className="text-shell-subtleText hover:text-shell-text hover:underline"
          >
            Editar roles
          </button>
        ) : (
          <>
            <button type="button" onClick={() => onLink(member)} className="text-brand-primary hover:underline">
              Vincular cuenta
            </button>
            <button type="button" onClick={() => onRename(member)} className="text-shell-subtleText hover:text-shell-text hover:underline">
              Cambiar nombre
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onToggleActive(member)}
          className={member.isActive ? 'text-red-500 hover:text-red-700 hover:underline' : 'text-teal-700 hover:underline'}
        >
          {member.isActive ? 'Desactivar' : 'Reactivar'}
        </button>
      </div>
    </div>
  )
}

export function AdminStaffPage() {
  const navigate = useNavigate()
  const [staffMembers, setStaffMembers] = useState<AdminStaffMember[]>([])
  const [allUsers, setAllUsers] = useState<AdminManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formMode, setFormMode] = useState<FormMode>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [linkedUserIds, setLinkedUserIds] = useState<string[]>([])
  const pickerRef = useRef<HTMLInputElement | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [targetStaff, setTargetStaff] = useState<AdminStaffMember | null>(null)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean; message: string; title: string; onConfirm: () => void
  }>({ isOpen: false, message: '', title: 'Confirmar', onConfirm: () => {} })

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, message, onConfirm })
  }
  const closeConfirm = () => setConfirmState((prev) => ({ ...prev, isOpen: false }))

  const loadData = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [staffData, usersData] = await Promise.all([listAdminStaffMembers(), listAdminUsers()])
      setStaffMembers(staffData)
      setAllUsers(usersData)
      // Non-critical: if this fails the toggle is simply hidden
    } catch {
      setErrorMessage('No pudimos cargar la lista de profesionales en este momento.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Pop-up: the first Escape closes the account drop-down, the next one the pop-up
  useEffect(() => {
    if (formMode === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isSaving) return
      if (pickerOpen) setPickerOpen(false)
      else closeForm()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formMode, pickerOpen, isSaving])

  // Which accounts are taken: ask the server each time a form that picks an account opens
  const needsAccount = formMode === 'account' || formMode === 'link'
  useEffect(() => {
    if (needsAccount) pickerRef.current?.focus()
  }, [needsAccount, formMode])
  useEffect(() => {
    if (!needsAccount) return
    let cancelled = false
    listLinkedStaffUserIds()
      .then((ids) => {
        if (!cancelled) setLinkedUserIds(ids)
      })
      .catch(() => {
        // Keep what the professionals list already tells
      })
    return () => {
      cancelled = true
    }
  }, [needsAccount])

  const resetForm = () => {
    setPickerOpen(false)
    setSelectedUserId('')
    setTargetStaff(null)
    setGuestName('')
    setGuestEmail('')
  }

  const openCreateForm = () => {
    resetForm()
    setFormMode('account')
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const openLinkForm = (member: AdminStaffMember) => {
    resetForm()
    setTargetStaff(member)
    setFormMode('link')
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const openRenameForm = (member: AdminStaffMember) => {
    resetForm()
    setTargetStaff(member)
    setGuestName(member.displayName)
    setFormMode('rename')
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const closeForm = () => {
    setFormMode(null)
    resetForm()
  }

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)

    if ((formMode === 'account' || formMode === 'link') && !selectedUserId) {
      setErrorMessage('Seleccioná un usuario para vincular al profesional.')
      return
    }
    if ((formMode === 'guest' || formMode === 'rename') && guestName.trim().length < 2) {
      setErrorMessage('El nombre debe tener al menos 2 caracteres.')
      return
    }

    setIsSaving(true)

    try {
      if (formMode === 'account') {
        // The professional takes the name of the account: nothing else to type
        const created = await adminCreateStaffMember(selectedUserId)
        setStaffMembers((current) => [...current, created])
        setSuccessMessage('Profesional creado correctamente.')
      } else if (formMode === 'guest') {
        const created = await adminCreateStaffWithoutAccount(guestName.trim(), guestEmail)
        setStaffMembers((current) => [...current, created])
        setSuccessMessage(
          created.profileUserId
            ? 'Ese email ya tenía cuenta: el profesional quedó vinculado.'
            : created.inviteEmail
              ? `Profesional creado. Cuando ${created.inviteEmail} entre a la app, queda vinculado.`
              : 'Profesional creado sin cuenta.',
        )
      } else if (formMode === 'link' && targetStaff) {
        const linked = await adminLinkStaffMember(targetStaff.id, selectedUserId)
        setStaffMembers((current) => current.map((m) => (m.id === linked.id ? linked : m)))
        setSuccessMessage('Cuenta vinculada. El profesional usa el nombre de la cuenta.')
      } else if (formMode === 'rename' && targetStaff) {
        await adminRenameStaffMember(targetStaff.id, guestName.trim())
        setStaffMembers((current) =>
          current.map((m) => (m.id === targetStaff.id ? { ...m, displayName: guestName.trim() } : m)),
        )
        setSuccessMessage('Nombre actualizado.')
      }
      closeForm()
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('duplicate') || message.includes('unique')) {
        setErrorMessage('Ya existe un profesional vinculado a ese usuario.')
      } else {
        setErrorMessage(message || 'No pudimos guardar los cambios. Intentá de nuevo.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = (member: AdminStaffMember) => {
    const action = member.isActive ? 'desactivar' : 'reactivar'
    showConfirm(
      member.isActive ? 'Desactivar profesional' : 'Reactivar profesional',
      `¿Confirmás ${action} a ${member.displayName}?${member.isActive ? ' Nota: esto no revoca el acceso a la aplicación.' : ''}`,
      async () => {
        closeConfirm()
        setSuccessMessage(null)
        setErrorMessage(null)
        try {
          await adminSetStaffActive(member.id, !member.isActive)
          setStaffMembers((current) =>
            current.map((m) => (m.id === member.id ? { ...m, isActive: !m.isActive } : m)),
          )
          setSuccessMessage(
            member.isActive
              ? `${member.displayName} fue desactivado.`
              : `${member.displayName} fue reactivado.`,
          )
        } catch {
          setErrorMessage('No pudimos actualizar el estado del profesional.')
        }
      },
    )
  }

  const takenUserIds = [
    ...new Set([
      ...linkedUserIds,
      ...staffMembers.flatMap((m) => (m.profileUserId ? [m.profileUserId] : [])),
    ]),
  ]

  if (isLoading) {
    return (
      <div className="space-y-3 max-w-3xl">
        <div className="h-8 w-48 rounded-xl bg-shell-muted animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="shell-surface rounded-2xl border shadow-sm p-4 flex gap-3.5">
            <div className="w-11 h-11 rounded-full bg-shell-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-36 rounded bg-shell-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-shell-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-5 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-shell-text">Profesionales</h1>
            {staffMembers.length > 0 && (
              <p className="text-sm text-shell-subtleText mt-0.5">
                {staffMembers.length} {staffMembers.length === 1 ? 'profesional' : 'profesionales'}
              </p>
            )}
          </div>
          {formMode === null && (
            <button
              type="button"
              onClick={openCreateForm}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              + Agregar profesional
            </button>
          )}
        </div>

        {/* Feedback messages */}
        {errorMessage && formMode === null && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start gap-2">
            <span className="shrink-0 mt-0.5">✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Create / link / rename form */}
        {formMode !== null && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-form-title"
            className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
          >
            <div className="p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <h2 id="staff-form-title" className="mb-1 font-heading text-base font-semibold text-shell-text">
                {formMode === 'link'
                  ? `Vincular una cuenta a ${targetStaff?.displayName ?? ''}`
                  : formMode === 'rename'
                    ? `Cambiar nombre de ${targetStaff?.displayName ?? ''}`
                    : 'Nuevo profesional'}
              </h2>

              {(formMode === 'account' || formMode === 'guest') && (
                <div role="radiogroup" aria-label="Tipo de profesional" className="mb-3 mt-2 grid grid-cols-2 gap-2">
                  {([
                    { value: 'account', label: 'Con cuenta' },
                    { value: 'guest', label: 'Sin cuenta' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={formMode === opt.value}
                      onClick={() => setFormMode(opt.value)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                        formMode === opt.value
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-shell-border bg-white text-shell-text hover:bg-shell-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={(e) => void handleFormSubmit(e)} noValidate className="space-y-4">
                {(formMode === 'account' || formMode === 'link') && (
                  <div>
                    <p className="mb-2 text-sm text-shell-subtleText">
                      Buscá o elegí la cuenta. El profesional usa el nombre de esa cuenta.
                    </p>
                    <AccountPicker
                      accounts={allUsers}
                      linkedUserIds={takenUserIds}
                      value={selectedUserId}
                      onChange={setSelectedUserId}
                      open={pickerOpen}
                      onOpenChange={setPickerOpen}
                      inputRef={pickerRef}
                      id="staff-account"
                    />
                  </div>
                )}

                {(formMode === 'guest' || formMode === 'rename') && (
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="staff-guest-name"
                        className="block text-xs font-semibold text-shell-subtleText mb-1.5 uppercase tracking-wide"
                      >
                        Nombre
                      </label>
                      <input
                        id="staff-guest-name"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full border border-shell-border rounded-xl px-3 py-2 text-sm text-shell-text bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Ej: María González"
                        autoComplete="off"
                        autoFocus
                      />
                    </div>
                    {formMode === 'guest' && (
                      <div>
                        <label
                          htmlFor="staff-guest-email"
                          className="block text-xs font-semibold text-shell-subtleText mb-1.5 uppercase tracking-wide"
                        >
                          Email <span className="normal-case font-normal">(opcional)</span>
                        </label>
                        <input
                          id="staff-guest-email"
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          className="w-full border border-shell-border rounded-xl px-3 py-2 text-sm text-shell-text bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="maria@gmail.com"
                          autoComplete="off"
                        />
                        <p className="mt-1.5 text-xs text-shell-subtleText">
                          Cuando esa persona entre a la app con este email, queda vinculada sola y pasa a ser staff.
                          Podés vincularla a mano más adelante.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {errorMessage && (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMessage}
                  </p>
                )}

                <div className="flex gap-3 justify-end pt-1">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 border border-shell-border rounded-xl text-sm font-medium text-shell-subtleText hover:bg-shell-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-brand-primary text-white rounded-xl hover:opacity-90 text-sm font-semibold disabled:opacity-50 transition-opacity shadow-sm"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </section>
          </div>
        )}

        {/* Staff cards */}
        {staffMembers.length === 0 && formMode === null ? (
          <div className="shell-surface rounded-2xl border shadow-sm text-center py-16 px-6">
            <div className="w-14 h-14 rounded-full bg-shell-muted flex items-center justify-center mx-auto mb-4 text-xl">
              👤
            </div>
            <p className="font-heading text-base font-semibold text-shell-text mb-1">
              Sin profesionales registrados
            </p>
            <p className="text-sm text-shell-subtleText mb-5">
              Creá el primero para comenzar a gestionar la agenda del equipo.
            </p>
            <button
              type="button"
              onClick={openCreateForm}
              className="px-5 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 text-sm font-semibold transition-colors shadow-sm"
            >
              + Agregar profesional
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {staffMembers.map((member) => (
              <StaffMemberCard
                key={member.id}
                member={member}
                onToggleActive={handleToggleActive}
                onNavigate={navigate}
                onLink={openLinkForm}
                onRename={openRenameForm}
                roles={allUsers.find((u) => u.userId === member.profileUserId)?.roles}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-shell-subtleText pb-2">
          Nota: desactivar un profesional no revoca su acceso a la aplicación. Gestioná el acceso y los
          roles desde{' '}
          <Link to="/admin/users" className="font-semibold underline">
            Usuarios y roles
          </Link>
          .
        </p>
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />
    </>
  )
}
