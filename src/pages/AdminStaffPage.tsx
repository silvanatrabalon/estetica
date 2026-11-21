import { FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  adminCreateStaffMember,
  adminSetStaffActive,
  adminSetStaffAvailabilityPermission,
  adminUpdateStaffMember,
  listAdminStaffMembers,
  listStaffAvailabilityPermissions,
  type AdminStaffMember,
} from '../services/adminStaff'
import { listAdminUsers, type AdminManagedRole, type AdminManagedUser } from '../services/adminUsers'
import { roleLabel } from '../lib/adminUsersView'
import { ConfirmModal } from '../components/ConfirmModal'
import { Select } from '../components/Select'

type FormMode = 'create' | 'edit' | null

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
  onEdit: (member: AdminStaffMember) => void
  onToggleActive: (member: AdminStaffMember) => void
  onNavigate: (path: string) => void
  /** All roles of the linked user (from the users directory) */
  roles?: AdminManagedRole[]
  /** undefined = unknown (toggle hidden) */
  canEditAvailability?: boolean
  onToggleAvailabilityPermission: (member: AdminStaffMember, allowed: boolean) => void
}

function StaffMemberCard({
  member,
  onEdit,
  onToggleActive,
  onNavigate,
  roles,
  canEditAvailability,
  onToggleAvailabilityPermission,
}: StaffMemberCardProps) {
  const initials = getInitials(member.displayName)
  // Highest role first; fall back to the single role from the staff list if the user is unknown
  const roleOrder: AdminManagedRole[] = ['admin', 'staff', 'customer']
  const shownRoles = roleOrder.filter((r) => (roles && roles.length > 0 ? roles : [member.role]).includes(r))

  return (
    <div
      className={`shell-surface rounded-2xl border shadow-sm overflow-hidden transition-opacity ${
        !member.isActive ? 'opacity-60' : ''
      }`}
    >
      <div className="p-4 flex items-start gap-3.5">
        {/* Avatar */}
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-heading font-bold text-sm select-none ${
            member.isActive
              ? 'bg-teal-100 text-teal-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <p className="font-heading font-semibold text-shell-text leading-tight">
                {member.displayName}
              </p>
              {member.fullName && (
                <p className="text-xs text-shell-subtleText mt-0.5 truncate">
                  {member.fullName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  member.isActive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {member.isActive ? 'Activo' : 'Inactivo'}
              </span>
              {shownRoles.map((r) => (
                <span
                  key={r}
                  className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700"
                >
                  {roleLabel(r)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {canEditAvailability !== undefined && (
        <label className="px-4 pb-3 flex items-start gap-2 text-xs text-shell-subtleText cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={canEditAvailability}
            onChange={(e) => onToggleAvailabilityPermission(member, e.target.checked)}
            aria-label={`Puede editar su propia disponibilidad: ${member.displayName}`}
          />
          <span>
            Puede editar su propia disponibilidad
            <span className="block text-[11px] text-gray-400">
              Si lo desmarcás, ve su horario pero solo vos podés cambiarlo.
            </span>
          </span>
        </label>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex flex-wrap gap-2 border-t border-shell-border pt-3">
        <button
          type="button"
          onClick={() => onEdit(member)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-shell-border text-shell-subtleText hover:bg-shell-muted hover:text-shell-text transition-colors"
        >
          Cambiar nombre
        </button>
        {member.profileUserId && (
          <button
            type="button"
            onClick={() => onNavigate(`/admin/users/${member.profileUserId}`)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-shell-border text-shell-subtleText hover:bg-shell-muted hover:text-shell-text transition-colors"
          >
            Editar roles
          </button>
        )}
        <button
          type="button"
          onClick={() => onNavigate(`/admin/staff/${member.id}/availability`)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-shell-border text-shell-subtleText hover:bg-shell-muted hover:text-shell-text transition-colors"
        >
          Disponibilidad
        </button>
        <button
          type="button"
          onClick={() => onNavigate(`/admin/staff/${member.id}/services`)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-shell-border text-shell-subtleText hover:bg-shell-muted hover:text-shell-text transition-colors"
        >
          Servicios
        </button>
        <button
          type="button"
          onClick={() => onToggleActive(member)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
            member.isActive
              ? 'border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700'
              : 'border border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-800'
          }`}
        >
          {member.isActive ? 'Desactivar' : 'Reactivar'}
        </button>
      </div>
    </div>
  )
}

function validateDisplayName(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length < 2) {
    return 'El nombre debe tener al menos 2 caracteres.'
  }
  return null
}

export function AdminStaffPage() {
  const navigate = useNavigate()
  const [staffMembers, setStaffMembers] = useState<AdminStaffMember[]>([])
  const [allUsers, setAllUsers] = useState<AdminManagedUser[]>([])
  const [availabilityPermissions, setAvailabilityPermissions] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formMode, setFormMode] = useState<FormMode>(null)
  const formRef = useRef<HTMLElement | null>(null)
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
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
      setAvailabilityPermissions(await listStaffAvailabilityPermissions().catch(() => ({})))
    } catch {
      setErrorMessage('No pudimos cargar la lista de profesionales en este momento.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // The form opens above the cards: bring it into view so "Editar" visibly does something
  useEffect(() => {
    if (formMode !== null) {
      formRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    }
  }, [formMode, editingStaffId])

  const openCreateForm = () => {
    setFormMode('create')
    setEditingStaffId(null)
    setSelectedUserId('')
    setDisplayName('')
    setDisplayNameError(null)
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const openEditForm = (member: AdminStaffMember) => {
    setFormMode('edit')
    setEditingStaffId(member.id)
    setDisplayName(member.displayName)
    setDisplayNameError(null)
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingStaffId(null)
    setSelectedUserId('')
    setDisplayName('')
    setDisplayNameError(null)
  }

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccessMessage(null)
    setErrorMessage(null)
    setDisplayNameError(null)

    const validationError = validateDisplayName(displayName)
    if (validationError) {
      setDisplayNameError(validationError)
      return
    }

    if (formMode === 'create' && !selectedUserId) {
      setErrorMessage('Seleccioná un usuario para vincular al profesional.')
      return
    }

    setIsSaving(true)

    try {
      if (formMode === 'create') {
        const created = await adminCreateStaffMember(selectedUserId, displayName.trim())
        setStaffMembers((current) => [...current, created])
        setSuccessMessage('Profesional creado correctamente.')
        closeForm()
      } else if (formMode === 'edit' && editingStaffId) {
        const updated = await adminUpdateStaffMember(editingStaffId, displayName.trim())
        setStaffMembers((current) =>
          current.map((m) => (m.id === updated.id ? updated : m)),
        )
        setSuccessMessage('Profesional actualizado correctamente.')
        closeForm()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('duplicate') || message.includes('unique')) {
        setErrorMessage('Ya existe un profesional vinculado a ese usuario.')
      } else {
        setErrorMessage('No pudimos guardar los cambios. Intentá de nuevo.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleAvailabilityPermission = async (member: AdminStaffMember, allowed: boolean) => {
    setSuccessMessage(null)
    setErrorMessage(null)
    const previous = availabilityPermissions[member.id]
    setAvailabilityPermissions((current) => ({ ...current, [member.id]: allowed }))

    try {
      await adminSetStaffAvailabilityPermission(member.id, allowed)
      setSuccessMessage(
        allowed
          ? `${member.displayName} ahora puede editar su disponibilidad.`
          : `${member.displayName} ya no puede editar su disponibilidad.`,
      )
    } catch {
      setAvailabilityPermissions((current) => ({ ...current, [member.id]: previous }))
      setErrorMessage('No pudimos cambiar el permiso. Intentá de nuevo.')
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

  const availableUsers = allUsers.filter(
    (u) => !staffMembers.some((sm) => sm.profileUserId === u.userId),
  )

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
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 active:bg-teal-800 text-sm font-semibold shadow-sm transition-colors shrink-0"
            >
              + Agregar profesional
            </button>
          )}
        </div>

        {/* Feedback messages */}
        {errorMessage && (
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

        {/* Create / Edit form */}
        {formMode !== null && (
          <section ref={formRef} className="shell-surface rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-shell-border bg-shell-muted/20">
              <h2 className="font-heading text-base font-semibold text-shell-text">
                {formMode === 'create' ? 'Nuevo profesional' : 'Editar profesional'}
              </h2>
            </div>
            <div className="p-5">
              <form onSubmit={(e) => void handleFormSubmit(e)} noValidate className="space-y-4">
                {formMode === 'create' && (
                  <div>
                    <label
                      htmlFor="staff-user-select"
                      className="block text-xs font-semibold text-shell-subtleText mb-1.5 uppercase tracking-wide"
                    >
                      Usuario vinculado
                    </label>
                    {availableUsers.length === 0 ? (
                      <p className="text-sm text-shell-subtleText">
                        No hay usuarios disponibles. Todos los usuarios ya tienen un profesional
                        asignado.
                      </p>
                    ) : (
                      <Select
                        id="staff-user-select"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full border border-shell-border rounded-xl px-3 py-2 text-sm text-shell-text bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        required
                      >
                        <option value="">Seleccioná un usuario</option>
                        {availableUsers.map((u) => (
                          <option key={u.userId} value={u.userId}>
                            {u.name || u.email || u.userId}
                          </option>
                        ))}
                      </Select>
                    )}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="staff-display-name"
                    className="block text-xs font-semibold text-shell-subtleText mb-1.5 uppercase tracking-wide"
                  >
                    Nombre para mostrar
                  </label>
                  <input
                    id="staff-display-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full border border-shell-border rounded-xl px-3 py-2 text-sm text-shell-text bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Ej: María González"
                  />
                  {displayNameError && (
                    <p className="mt-1.5 text-xs text-red-500">{displayNameError}</p>
                  )}
                </div>

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
                    className="px-5 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </section>
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
                onEdit={openEditForm}
                onToggleActive={handleToggleActive}
                onNavigate={navigate}
                roles={allUsers.find((u) => u.userId === member.profileUserId)?.roles}
                canEditAvailability={availabilityPermissions[member.id]}
                onToggleAvailabilityPermission={(m, allowed) => void handleToggleAvailabilityPermission(m, allowed)}
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

      {/* Mobile FAB */}
      {formMode === null && (
        <button
          type="button"
          onClick={openCreateForm}
          className="fixed bottom-6 right-6 z-50 sm:hidden flex items-center gap-1.5 px-5 py-3 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 text-sm font-semibold transition-colors"
          aria-label="Agregar profesional"
        >
          + Agregar
        </button>
      )}

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
