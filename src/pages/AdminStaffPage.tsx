import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  adminCreateStaffMember,
  adminSetStaffActive,
  adminUpdateStaffMember,
  listAdminStaffMembers,
  type AdminStaffMember,
} from '../services/adminStaff'
import { listAdminUsers, type AdminManagedUser } from '../services/adminUsers'

type FormMode = 'create' | 'edit' | null

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
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [staffData, usersData] = await Promise.all([listAdminStaffMembers(), listAdminUsers()])
      setStaffMembers(staffData)
      setAllUsers(usersData)
    } catch {
      setErrorMessage('No pudimos cargar la lista de profesionales en este momento.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

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

  const handleToggleActive = async (member: AdminStaffMember) => {
    const action = member.isActive ? 'desactivar' : 'reactivar'
    const confirmed = window.confirm(
      `¿Confirmás ${action} a ${member.displayName}? ${
        member.isActive
          ? 'Nota: esto no revoca el acceso a la aplicación.'
          : ''
      }`,
    )
    if (!confirmed) return

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
  }

  const availableUsers = allUsers.filter(
    (u) => !staffMembers.some((sm) => sm.profileUserId === u.userId),
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando profesionales...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Profesionales</h1>
        {formMode === null && (
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Agregar profesional
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {successMessage}
        </div>
      )}

      {formMode !== null && (
        <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h2 className="text-lg font-medium text-gray-800 mb-4">
            {formMode === 'create' ? 'Nuevo profesional' : 'Editar profesional'}
          </h2>
          <form onSubmit={(e) => void handleFormSubmit(e)} noValidate>
            {formMode === 'create' && (
              <div className="mb-4">
                <label htmlFor="staff-user-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario vinculado
                </label>
                {availableUsers.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay usuarios disponibles para vincular. Todos los usuarios existentes ya tienen un profesional asignado.
                  </p>
                ) : (
                  <select
                    id="staff-user-select"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccioná un usuario</option>
                    {availableUsers.map((u) => (
                      <option key={u.userId} value={u.userId}>
                        {u.name || u.email || u.userId}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="staff-display-name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre para mostrar
              </label>
              <input
                id="staff-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: María González"
              />
              {displayNameError && (
                <p className="mt-1 text-sm text-red-600">{displayNameError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {staffMembers.length === 0 && formMode === null ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No hay profesionales registrados todavía.</p>
          <p className="text-sm">Usá el botón &quot;Agregar profesional&quot; para crear el primero.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="pb-3 pr-4 font-medium">Nombre</th>
                <th className="pb-3 pr-4 font-medium">Usuario vinculado</th>
                <th className="pb-3 pr-4 font-medium">Rol</th>
                <th className="pb-3 pr-4 font-medium">Estado</th>
                <th className="pb-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {staffMembers.map((member) => (
                <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-900">{member.displayName}</td>
                  <td className="py-3 pr-4 text-gray-600">{member.fullName ?? '—'}</td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {member.role === 'admin' ? 'Administrador' : member.role === 'staff' ? 'Staff' : 'Cliente'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {member.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditForm(member)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/staff/${member.id}/availability`)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Disponibilidad
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/staff/${member.id}/services`)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Servicios
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(member)}
                        className="text-gray-600 hover:text-gray-800 text-xs font-medium"
                      >
                        {member.isActive ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-gray-400">
            Nota: desactivar un profesional no revoca su acceso a la aplicación. Para revocar el acceso, gestioná el usuario desde el panel de usuarios.
          </p>
        </div>
      )}
    </div>
  )
}
