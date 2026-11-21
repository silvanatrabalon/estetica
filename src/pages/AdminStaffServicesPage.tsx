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
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/admin/staff')}
          aria-label="Volver a profesionales"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-brand-primary hover:bg-shell-muted"
        >
          ←
        </button>
        <h1 className="font-heading text-xl font-semibold text-shell-text">Servicios asignados</h1>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Assign */}
      <section className="shell-surface rounded-2xl border p-4 shadow-sm">
        {assignableServices.length === 0 ? (
          <p className="text-sm text-shell-subtleText">Todos los servicios activos ya están asignados.</p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="assign-service-select" className="mb-1 block text-xs font-medium text-shell-subtleText">
                Agregar un servicio
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
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAssigning ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        )}
      </section>

      {/* Assigned services */}
      {assignedServices.length === 0 ? (
        <div className="shell-surface rounded-2xl border py-10 text-center shadow-sm">
          <p className="text-sm text-shell-subtleText">Este profesional no tiene servicios asignados todavía.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {assignedServices.map((service) => (
            <li
              key={service.serviceId}
              className="shell-surface flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-shell-text">{service.name}</p>
                <p className="text-xs text-shell-subtleText">
                  {service.durationMinutes} min · {formatPriceARS(service.priceCents)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleUnassign(service.serviceId)}
                disabled={unassigningId === service.serviceId}
                className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                {unassigningId === service.serviceId ? 'Quitando...' : 'Quitar'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
