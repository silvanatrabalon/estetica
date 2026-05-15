import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  assignServiceToStaff,
  listAssignableServices,
  listStaffServices,
  unassignServiceFromStaff,
  type StaffService,
} from '../services/adminStaffServices'
import { formatPriceARS } from '../lib/formatPrice'

export function AdminStaffServicesPage() {
  const { staffId } = useParams<{ staffId: string }>()
  const navigate = useNavigate()

  const [assignedServices, setAssignedServices] = useState<StaffService[]>([])
  const [assignableServices, setAssignableServices] = useState<StaffService[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [unassigningId, setUnassigningId] = useState<string | null>(null)

  if (!staffId) {
    return (
      <div className="p-6">
        <p className="text-red-600">Profesional no encontrado.</p>
      </div>
    )
  }

  const loadData = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [assigned, assignable] = await Promise.all([
        listStaffServices(staffId),
        listAssignableServices(staffId),
      ])
      setAssignedServices(assigned)
      setAssignableServices(assignable)
      setSelectedServiceId(assignable[0]?.serviceId ?? '')
    } catch {
      setErrorMessage('No pudimos cargar los servicios en este momento.')
    } finally {
      setIsLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId])

  const handleAssign = async () => {
    if (!selectedServiceId) return
    setIsAssigning(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      await assignServiceToStaff(staffId, selectedServiceId)
      await loadData()
      setSuccessMessage('Servicio asignado correctamente.')
    } catch {
      setErrorMessage('No pudimos asignar el servicio. Intentá de nuevo.')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleUnassign = async (serviceId: string) => {
    setUnassigningId(serviceId)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      await unassignServiceFromStaff(staffId, serviceId)
      await loadData()
      setSuccessMessage('Servicio quitado correctamente.')
    } catch {
      setErrorMessage('No pudimos quitar el servicio. Intentá de nuevo.')
    } finally {
      setUnassigningId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando servicios...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/admin/staff')}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Profesionales
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Servicios asignados</h1>
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

      {/* Assign section */}
      <div className="mb-8 p-4 border border-gray-200 rounded-md bg-gray-50">
        <h2 className="text-base font-medium text-gray-800 mb-3">Asignar servicio</h2>
        {assignableServices.length === 0 ? (
          <p className="text-sm text-gray-500">Todos los servicios activos ya están asignados.</p>
        ) : (
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="assign-service-select" className="block text-sm font-medium text-gray-700 mb-1">
                Servicio
              </label>
              <select
                id="assign-service-select"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {assignableServices.map((s) => (
                  <option key={s.serviceId} value={s.serviceId}>
                    {s.name} — {s.durationMinutes} min — {formatPriceARS(s.priceCents)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => void handleAssign()}
              disabled={isAssigning || !selectedServiceId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {isAssigning ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        )}
      </div>

      {/* Assigned services list */}
      <h2 className="text-base font-medium text-gray-800 mb-3">Servicios asignados</h2>
      {assignedServices.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm">
          Este profesional no tiene servicios asignados todavía.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="pb-3 pr-4 font-medium">Nombre</th>
                <th className="pb-3 pr-4 font-medium">Duración</th>
                <th className="pb-3 pr-4 font-medium">Precio</th>
                <th className="pb-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {assignedServices.map((service) => (
                <tr key={service.serviceId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-900">{service.name}</td>
                  <td className="py-3 pr-4 text-gray-600">{service.durationMinutes} min</td>
                  <td className="py-3 pr-4 text-gray-600">{formatPriceARS(service.priceCents)}</td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => void handleUnassign(service.serviceId)}
                      disabled={unassigningId === service.serviceId}
                      className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50"
                    >
                      {unassigningId === service.serviceId ? 'Quitando...' : 'Quitar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
