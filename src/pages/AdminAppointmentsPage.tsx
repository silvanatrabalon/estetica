import { useEffect, useState } from 'react'
import { cn } from '../lib/cn'
import { formatSlotTime } from '../lib/formatSlotTime'
import { getBusinessSettings } from '../services/businessSettings'
import {
  adminListAppointments,
  type AdminAppointmentFilters,
  type AdminAppointmentPage,
  type AdminAppointmentRow,
} from '../services/adminAppointments'

const PAGE_SIZE = 50

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
  no_show: 'No asistió',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-800',
  no_show: 'bg-gray-100 text-gray-600',
}

const ALL_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']

const EMPTY_FILTERS: AdminAppointmentFilters = {
  statuses: [],
  dateFrom: '',
  dateTo: '',
}

export function AdminAppointmentsPage() {
  const [filters, setFilters] = useState<AdminAppointmentFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AdminAppointmentPage>({ rows: [], totalCount: 0 })
  const [orgTimezone, setOrgTimezone] = useState('UTC')

  useEffect(() => {
    getBusinessSettings()
      .then((settings) => setOrgTimezone(settings.timezone))
      .catch(() => {
        // silently fall back to UTC
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const activeFilters: AdminAppointmentFilters = {
      statuses: filters.statuses?.length ? filters.statuses : undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    }

    adminListAppointments(activeFilters, page, PAGE_SIZE)
      .then((data) => {
        if (!cancelled) setResult(data)
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Ocurrió un error al cargar los turnos.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filters, page])

  function toggleStatus(status: string) {
    setFilters((prev) => {
      const current = prev.statuses ?? []
      const updated = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status]
      return { ...prev, statuses: updated }
    })
    setPage(1)
  }

  function handleDateFrom(value: string) {
    setFilters((prev) => ({ ...prev, dateFrom: value }))
    setPage(1)
  }

  function handleDateTo(value: string) {
    setFilters((prev) => ({ ...prev, dateTo: value }))
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(result.totalCount / PAGE_SIZE))
  const isLastPage = page * PAGE_SIZE >= result.totalCount

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Turnos</h1>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        {/* Status chips */}
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((status) => {
            const active = filters.statuses?.includes(status) ?? false
            return (
              <button
                key={status}
                type="button"
                aria-pressed={active}
                onClick={() => toggleStatus(status)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium border transition-colors',
                  active
                    ? (STATUS_COLORS[status] ?? 'bg-gray-200 text-gray-800') +
                        ' border-transparent'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                )}
              >
                {STATUS_LABELS[status] ?? status}
              </button>
            )
          })}
        </div>

        {/* Date range */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Desde
            <input
              type="date"
              aria-label="Desde"
              value={filters.dateFrom ?? ''}
              onChange={(e) => handleDateFrom(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Hasta
            <input
              type="date"
              aria-label="Hasta"
              value={filters.dateTo ?? ''}
              onChange={(e) => handleDateTo(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </label>
        </div>
      </div>

      {/* States */}
      {loading && (
        <p className="text-gray-500 py-8 text-center">Cargando turnos...</p>
      )}

      {!loading && error && (
        <p className="text-red-600 py-8 text-center">Ocurrió un error al cargar los turnos.</p>
      )}

      {!loading && !error && result.rows.length === 0 && (
        <p className="text-gray-500 py-8 text-center">
          No hay turnos que coincidan con los filtros.
        </p>
      )}

      {/* Table */}
      {!loading && !error && result.rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Servicio</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Profesional</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Fecha/hora</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {result.rows.map((row: AdminAppointmentRow) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{row.customerName}</td>
                    <td className="px-4 py-3 text-gray-700">{row.serviceName}</td>
                    <td className="px-4 py-3 text-gray-700">{row.staffDisplayName}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatSlotTime(row.startsAt, orgTimezone)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                          STATUS_COLORS[row.status] ?? 'bg-gray-100 text-gray-600',
                        )}
                      >
                        {STATUS_LABELS[row.status] ?? row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={isLastPage}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
