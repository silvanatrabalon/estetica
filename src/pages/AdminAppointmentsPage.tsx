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
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border border-red-200',
  completed: 'bg-slate-100 text-slate-600 border border-slate-200',
}

const EMPTY_FILTERS: AdminAppointmentFilters = {
  statuses: [],
  dateFrom: '',
  dateTo: '',
}

export function AdminAppointmentsPage() {
  const [filters, setFilters] = useState<AdminAppointmentFilters>(EMPTY_FILTERS)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
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
      statuses: selectedStatus ? [selectedStatus] : undefined,
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
  }, [filters, selectedStatus, page])

  function handleStatusChange(value: string) {
    setSelectedStatus(value)
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
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-shell-text">Turnos</h1>

      {/* Filters */}
      <section className="shell-surface rounded-2xl border p-5 shadow-sm">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Filtros</h2>
        <div className="flex flex-wrap gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-shell-subtleText">Estado</span>
            <select
              aria-label="Filtrar por estado"
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-lg border border-shell-border bg-white px-3 py-2 text-sm text-shell-text min-w-[160px] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            >
              <option value="">Todos los estados</option>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendiente</option>
              <option value="cancelled">Cancelado</option>
              <option value="completed">Completado</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-shell-subtleText">Desde</span>
            <input
              type="date"
              aria-label="Desde"
              value={filters.dateFrom ?? ''}
              onChange={(e) => handleDateFrom(e.target.value)}
              className="rounded-lg border border-shell-border bg-white px-3 py-2 text-sm text-shell-text focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-shell-subtleText">Hasta</span>
            <input
              type="date"
              aria-label="Hasta"
              value={filters.dateTo ?? ''}
              onChange={(e) => handleDateTo(e.target.value)}
              className="rounded-lg border border-shell-border bg-white px-3 py-2 text-sm text-shell-text focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
            />
          </label>
        </div>
      </section>

      {/* Loading */}
      {loading && (
        <p className="py-10 text-center text-sm text-shell-subtleText">Cargando turnos...</p>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">Ocurrió un error al cargar los turnos.</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && result.rows.length === 0 && (
        <div className="shell-surface rounded-2xl border py-14 text-center shadow-sm">
          <p className="text-sm text-shell-subtleText">No hay turnos que coincidan con los filtros.</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && result.rows.length > 0 && (
        <div className="shell-surface rounded-2xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-shell-border text-sm">
              <thead>
                <tr className="bg-shell-muted">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Cliente</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Servicio</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-shell-subtleText hidden md:table-cell">Profesional</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Fecha / hora</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shell-border bg-white">
                {result.rows.map((row: AdminAppointmentRow) => (
                  <tr key={row.id} className="transition-colors hover:bg-shell-muted">
                    <td className="px-5 py-3.5 font-medium text-shell-text">{row.customerName}</td>
                    <td className="px-5 py-3.5 text-shell-subtleText">{row.serviceName}</td>
                    <td className="px-5 py-3.5 text-shell-subtleText hidden md:table-cell">{row.staffDisplayName}</td>
                    <td className="px-5 py-3.5 text-shell-subtleText whitespace-nowrap">
                      {formatSlotTime(row.startsAt, orgTimezone)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                          STATUS_COLORS[row.status] ?? 'bg-slate-100 text-slate-600 border border-slate-200',
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
          <div className="flex items-center justify-between border-t border-shell-border px-5 py-3">
            <span className="text-xs text-shell-subtleText">
              Página {page} de {totalPages} · {result.totalCount} turno{result.totalCount !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="rounded-lg border border-shell-border px-3 py-1.5 text-xs font-medium text-shell-text hover:bg-shell-muted disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={isLastPage}
                className="rounded-lg border border-shell-border px-3 py-1.5 text-xs font-medium text-shell-text hover:bg-shell-muted disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
