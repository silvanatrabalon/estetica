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
import { Select } from '../components/Select'

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/staff')}
          className="text-sm text-shell-subtleText hover:text-shell-text inline-flex items-center gap-1 transition-colors"
        >
          ← Profesionales
        </button>
        <h1 className="font-heading text-2xl font-semibold text-shell-text">Servicios asignados</h1>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Assign section */}
      <section className="shell-surface rounded-2xl border p-5 shadow-sm">
        <h2 className="font-heading text-base font-semibold text-shell-text mb-4">Asignar servicio</h2>
        {assignableServices.length === 0 ? (
          <p className="text-sm text-shell-subtleText">Todos los servicios activos ya están asignados.</p>
        ) : (
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="assign-service-select" className="block text-xs font-medium text-shell-subtleText mb-1">
                Servicio
              </label>
              <Select
                id="assign-service-select"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full rounded-lg border border-shell-border bg-white px-3 py-2 text-sm text-shell-text focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
              >
                {assignableServices.map((s) => (
                  <option key={s.serviceId} value={s.serviceId}>
                    {s.name} — {s.durationMinutes} min — {formatPriceARS(s.priceCents)}
                  </option>
                ))}
              </Select>
            </div>
            <button
              type="button"
              onClick={() => void handleAssign()}
              disabled={isAssigning || !selectedServiceId}
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {isAssigning ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        )}
      </section>

      {/* Assigned services list */}
      <section className="shell-surface rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-shell-border">
          <h2 className="font-heading text-base font-semibold text-shell-text">Servicios asignados</h2>
        </div>
        {assignedServices.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-shell-subtleText">Este profesional no tiene servicios asignados todavía.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm divide-y divide-shell-border">
              <thead>
                <tr className="bg-shell-muted">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Nombre</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Duración</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Precio</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shell-border bg-white">
                {assignedServices.map((service) => (
                  <tr key={service.serviceId} className="transition-colors hover:bg-shell-muted">
                    <td className="px-5 py-3.5 font-medium text-shell-text">{service.name}</td>
                    <td className="px-5 py-3.5 text-shell-subtleText">{service.durationMinutes} min</td>
                    <td className="px-5 py-3.5 text-shell-subtleText">{formatPriceARS(service.priceCents)}</td>
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => void handleUnassign(service.serviceId)}
                        disabled={unassigningId === service.serviceId}
                        className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
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
      </section>
    </div>
  )
}
