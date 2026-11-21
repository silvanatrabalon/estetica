import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { normalizePhone, normalizeProfileName, validateProfileInput } from '../lib/profile'
import { commonCopy } from '../lib/uiCopy'
import { ALL_ROLES, formatRelativeDate, roleLabel } from '../lib/adminUsersView'
import { isLastActiveAdminRoleDemotion, isSelfDemotion } from '../lib/adminUserPolicies'
import {
  adminAssignUserRole,
  adminRevokeUserRole,
  adminUpdateUserProfile,
  listAdminUsers,
  type AdminManagedRole,
  type AdminManagedUser,
} from '../services/adminUsers'
import { useUser } from '../hooks/useUser'
import { ConfirmModal } from '../components/ConfirmModal'
import { initSupabase } from '../lib/supabase'

type LoadState = 'loading' | 'ready' | 'not-found' | 'error'

/** One user: personal data, roles and the delete action. Reached from "Editar roles". */
export function AdminUserEditPage() {
  const { userId = '' } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useUser()

  const topRef = useRef<HTMLElement | null>(null)
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

  // Arriving from the list keeps its scroll position: start at the top of this screen
  useEffect(() => {
    if (loadState === 'ready') topRef.current?.scrollIntoView?.({ block: 'start' })
  }, [loadState])

  useEffect(() => {
    if (target) {
      setName(target.name)
      setPhone(target.phone ?? '')
    }
  }, [target])

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
      navigate('/admin/users', { replace: true, state: { notice: 'Usuario eliminado correctamente.' } })
    } catch (err) {
      setDeleteOpen(false)
      setErrorMessage(err instanceof Error ? err.message : 'Ocurrió un error al eliminar el usuario.')
    } finally {
      setIsDeleting(false)
    }
  }

  const backLink = (
    <Link to="/admin/users" className="text-sm font-semibold text-teal-700 hover:underline">
      ← Usuarios y roles
    </Link>
  )

  if (loadState === 'loading') {
    return <p className="text-sm text-shell-subtleText">{commonCopy.loading}</p>
  }

  if (loadState === 'error') {
    return (
      <section className="space-y-4">
        {backLink}
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          No pudimos cargar el usuario en este momento.
        </p>
      </section>
    )
  }

  if (loadState === 'not-found' || !target) {
    return (
      <section className="space-y-4">
        {backLink}
        <p className="text-sm text-shell-subtleText">No encontramos a ese usuario.</p>
      </section>
    )
  }

  return (
    <section ref={topRef} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        {backLink}
        <h2 className="font-heading text-2xl font-semibold text-shell-text">
          {target.name || 'Usuario sin nombre'}
        </h2>
        <p className="text-sm text-shell-subtleText">{target.email ?? target.userId}</p>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <div className="shell-surface rounded-2xl border p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-shell-text">Roles</h3>
        <div className="flex flex-wrap gap-3">
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
        <p className="text-xs text-shell-subtleText">
          Cliente reserva turnos. Staff atiende y ve su agenda. Administrador gestiona todo el negocio.
        </p>
      </div>

      <form onSubmit={handleProfileSubmit} className="shell-surface rounded-2xl border p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-shell-text">Datos</h3>
        <div>
          <label htmlFor="admin-profile-name" className="mb-1 block text-sm font-semibold text-shell-text">
            {commonCopy.nameLabel}
          </label>
          <input
            id="admin-profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-shell-text"
          />
        </div>
        <dl className="grid gap-3 rounded-lg border border-shell-border p-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Último acceso</dt>
            <dd className="text-shell-text">{formatRelativeDate(target.lastSignInAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Alta</dt>
            <dd className="text-shell-text">{formatRelativeDate(target.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Estado</dt>
            <dd className="text-shell-text">{target.isActive ? 'Activo' : 'Inactivo'}</dd>
          </div>
        </dl>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-micro hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingProfile ? commonCopy.saving : 'Guardar perfil de usuario'}
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6 space-y-3">
        <h3 className="text-lg font-semibold text-red-700">Eliminar usuario</h3>
        <p className="text-sm text-shell-subtleText">
          Elimina la cuenta y su acceso de forma permanente. Para solo impedir que entre, desactivalo desde la lista.
        </p>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          Eliminar usuario
        </button>
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
    </section>
  )
}
