import { FormEvent, useEffect, useMemo, useState } from 'react'
import { normalizePhone, normalizeProfileName, validateProfileInput } from '../../lib/profile'
import { commonCopy } from '../../lib/uiCopy'
import { ALL_ROLES, roleLabel } from '../../lib/adminUsersView'
import { isLastActiveAdminRoleDemotion, isSelfDemotion } from '../../lib/adminUserPolicies'
import {
  adminAssignUserRole,
  adminRevokeUserRole,
  adminUpdateUserProfile,
  listAdminUsers,
  type AdminManagedRole,
  type AdminManagedUser,
} from '../../services/adminUsers'
import { useUser } from '../../hooks/useUser'
import { ConfirmModal } from '../ConfirmModal'
import { initSupabase } from '../../lib/supabase'

type LoadState = 'loading' | 'ready' | 'not-found' | 'error'

interface UserEditModalProps {
  userId: string
  onClose: () => void
  /** Something about the user changed (roles or data): the list behind should refresh. */
  onChanged: () => void
  /** The user was deleted. */
  onDeleted: () => void
}

/** Pop-up with one user: roles, personal data and the delete action. Opened from "Editar roles". */
export function UserEditModal({ userId, onClose, onChanged, onDeleted }: UserEditModalProps) {
  const { user: currentUser } = useUser()

  const [users, setUsers] = useState<AdminManagedUser[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingRole, setIsSavingRole] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({ isOpen: false, title: 'Confirmar', message: '', onConfirm: () => {} })

  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setConfirmState({ isOpen: true, title, message, onConfirm })
  const closeConfirm = () => setConfirmState((prev) => ({ ...prev, isOpen: false }))

  const target = useMemo(() => users.find((u) => u.userId === userId) ?? null, [users, userId])
  const activeAdminCount = useMemo(
    () => users.filter((u) => u.roles.includes('admin') && u.isActive).length,
    [users],
  )

  useEffect(() => {
    let cancelled = false
    setLoadState('loading')
    listAdminUsers()
      .then((list) => {
        if (cancelled) return
        setUsers(list)
        setLoadState(list.some((u) => u.userId === userId) ? 'ready' : 'not-found')
      })
      .catch(() => {
        if (!cancelled) setLoadState('error')
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (target) {
      setName(target.name)
      setPhone(target.phone ?? '')
    }
  }, [target])

  const busy = isSavingProfile || isSavingRole || isDeleting
  const nested = confirmState.isOpen || deleteOpen
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy && !nested) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [busy, nested, onClose])

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!target) return
    setSuccessMessage(null)
    setErrorMessage(null)
    setNameError(null)

    const validation = validateProfileInput({ name, phone })
    if (!validation.valid) {
      setNameError(validation.errors.name ?? null)
      return
    }

    setIsSavingProfile(true)
    try {
      const updated = await adminUpdateUserProfile(target.userId, {
        name: normalizeProfileName(name),
        phone: normalizePhone(phone) ?? '',
      })
      setUsers((current) =>
        current.map((item) =>
          item.userId === updated.userId ? { ...item, name: updated.name, phone: updated.phone } : item,
        ),
      )
      setSuccessMessage('Perfil de usuario actualizado correctamente.')
      onChanged()
    } catch {
      setErrorMessage('No pudimos actualizar el perfil del usuario en este momento.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleRoleToggle = (toggledRole: AdminManagedRole, shouldAssign: boolean) => {
    if (!target) return

    const currentRoles = target.roles
    const nextRoles = shouldAssign
      ? [...new Set([...currentRoles, toggledRole])]
      : currentRoles.filter((r) => r !== toggledRole)

    if (nextRoles.length === 0) {
      setErrorMessage('El usuario debe tener al menos un rol asignado.')
      return
    }

    if (
      !shouldAssign &&
      (isSelfDemotion({ actorUserId: currentUser?.id ?? null, targetUserId: target.userId, nextRoles }) ||
        isLastActiveAdminRoleDemotion({
          currentRoles,
          nextRoles,
          isActive: target.isActive,
          activeAdminCount,
        }))
    ) {
      setErrorMessage('No podés aplicar ese cambio de rol por una restricción de seguridad.')
      return
    }

    showConfirm(
      'Cambiar rol',
      shouldAssign
        ? `¿Confirmás asignar el rol "${roleLabel(toggledRole)}" a este usuario?`
        : `¿Confirmás quitar el rol "${roleLabel(toggledRole)}" de este usuario?`,
      async () => {
        closeConfirm()
        setSuccessMessage(null)
        setErrorMessage(null)
        setIsSavingRole(true)
        try {
          if (shouldAssign) {
            await adminAssignUserRole(target.userId, toggledRole)
          } else {
            await adminRevokeUserRole(target.userId, toggledRole)
          }
          setUsers((current) =>
            current.map((item) => (item.userId === target.userId ? { ...item, roles: nextRoles } : item)),
          )
          setSuccessMessage('Roles actualizados correctamente.')
          onChanged()
        } catch {
          setErrorMessage('No pudimos actualizar el rol. Verificá permisos o restricciones de seguridad.')
        } finally {
          setIsSavingRole(false)
        }
      },
    )
  }

  const handleDelete = async () => {
    if (!target) return
    setIsDeleting(true)
    setErrorMessage(null)
    try {
      const { error } = await initSupabase().functions.invoke('admin-delete-user', {
        body: { userId: target.userId },
      })
      if (error) throw error
      setDeleteOpen(false)
      onDeleted()
    } catch (err) {
      setDeleteOpen(false)
      setErrorMessage(err instanceof Error ? err.message : 'Ocurrió un error al eliminar el usuario.')
    } finally {
      setIsDeleting(false)
    }
  }

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      disabled={busy}
      aria-label="Cerrar"
      className="shrink-0 rounded-lg px-2 py-1 text-xl leading-none text-shell-subtleText hover:bg-shell-muted disabled:opacity-50"
    >
      ×
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-edit-title"
        className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-2 border-b border-shell-border px-4 py-3">
          <div className="min-w-0">
            <h2 id="user-edit-title" className="truncate text-base font-semibold text-shell-text">
              {loadState === 'ready' && target ? target.name || 'Usuario sin nombre' : 'Editar roles'}
            </h2>
            {loadState === 'ready' && target && (
              <p className="truncate text-sm text-shell-subtleText">{target.email ?? target.userId}</p>
            )}
          </div>
          {closeButton}
        </div>

        <div className="space-y-4 overflow-y-auto p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {loadState === 'loading' && <p className="text-sm text-shell-subtleText">{commonCopy.loading}</p>}
          {loadState === 'error' && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              No pudimos cargar el usuario en este momento.
            </p>
          )}
          {loadState === 'not-found' && <p className="text-sm text-shell-subtleText">No encontramos a ese usuario.</p>}

          {loadState === 'ready' && target && (
            <>
              {errorMessage ? (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorMessage}
                </p>
              ) : null}
              {successMessage ? (
                <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {successMessage}
                </p>
              ) : null}

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-shell-text">Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((r) => (
                    <label
                      key={r}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-shell-border px-3 py-2 text-sm text-shell-text hover:bg-shell-muted"
                    >
                      <input
                        type="checkbox"
                        checked={target.roles.includes(r)}
                        disabled={isSavingRole}
                        onChange={(e) => handleRoleToggle(r, e.target.checked)}
                        className="h-4 w-4 rounded accent-teal-600"
                      />
                      {roleLabel(r)}
                    </label>
                  ))}
                </div>
              </section>

              <form onSubmit={handleProfileSubmit} className="space-y-3">
                <div>
                  <label htmlFor="admin-profile-name" className="mb-1 block text-sm font-medium text-shell-text">
                    {commonCopy.nameLabel}
                  </label>
                  <input
                    id="admin-profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm text-shell-text focus:border-brand-primary focus:outline-none"
                  />
                  {nameError ? <p className="mt-1 text-xs text-red-600">{nameError}</p> : null}
                </div>
                <div>
                  <label htmlFor="admin-profile-phone" className="mb-1 block text-sm font-medium text-shell-text">
                    {commonCopy.phoneOptionalLabel}
                  </label>
                  <input
                    id="admin-profile-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm text-shell-text focus:border-brand-primary focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingProfile ? commonCopy.saving : 'Guardar perfil de usuario'}
                  </button>
                </div>
              </form>

              <section className="space-y-2 rounded-xl border border-red-200 bg-red-50/40 p-3">
                <h3 className="text-sm font-semibold text-red-700">Eliminar usuario</h3>
                <p className="text-xs text-shell-subtleText">
                  Elimina la cuenta y su acceso de forma permanente. Para quitarle permisos, sacale el rol arriba.
                </p>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Eliminar usuario
                </button>
              </section>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

      <ConfirmModal
        isOpen={deleteOpen}
        title="Eliminar usuario"
        message="Esta acción eliminará permanentemente al usuario y su acceso. Sus turnos pasados quedarán sin nombre de cliente."
        confirmLabel={isDeleting ? 'Eliminando…' : 'Eliminar'}
        cancelLabel="Cancelar"
        destructive
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
