import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AdminAppointmentDetailPage } from './AdminAppointmentDetailPage'
import { cn } from '../lib/cn'
import { FilterMenu } from '../components/FilterMenu'
import { PERIOD_OPTIONS, getPeriodRange, isAscendingPeriod, type AppointmentPeriod } from '../lib/appointmentPeriods'
import { formatSlotDateTime } from '../lib/formatSlotTime'
import { STATUS_CARD, STATUS_LABELS } from '../lib/appointmentStatus'
import { getBusinessSettings } from '../services/businessSettings'
import { listAdminStaffMembers, type AdminStaffMember } from '../services/adminStaff'
import {
  adminListAppointments,
  staffListAppointments,
  type AdminAppointmentFilters,
  type AdminAppointmentPage,
  type AdminAppointmentRow,
} from '../services/adminAppointments'

const PAGE_SIZE = 50

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'completed', label: 'Completado' },
]

interface AppointmentsPageProps {
  /** 'staff': only the professional's own appointments (no professional filter, staff detail links). */
  mode?: 'admin' | 'staff'
}

export function AdminAppointmentsPage({ mode = 'admin' }: AppointmentsPageProps) {
  const isStaff = mode === 'staff'
  const basePath = isStaff ? '/staff/appointments' : '/admin/appointments'
  const [searchParams] = useSearchParams()
  // /…/appointments/:id opens the detail as a pop-up over this list
  const { id: openAppointmentId } = useParams<{ id: string }>()
  const [period, setPeriod] = useState<AppointmentPeriod>(() => {
    const fromUrl = searchParams.get('periodo')
    return PERIOD_OPTIONS.some((o) => o.value === fromUrl) ? (fromUrl as AppointmentPeriod) : 'today'
  })
  const [selectedStatus, setSelectedStatus] = useState<string>(() => {
    const fromUrl = searchParams.get('estado')
    return STATUS_OPTIONS.some((o) => o.value !== '' && o.value === fromUrl) ? (fromUrl as string) : ''
  })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AdminAppointmentPage>({ rows: [], totalCount: 0 })
  const [orgTimezone, setOrgTimezone] = useState('UTC')
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [professionals, setProfessionals] = useState<AdminStaffMember[]>([])
  // What is typed, and what is actually searched (a moment later, so each key does not hit the server)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  // Bumped when the pop-up changes an appointment, so the list reloads and shows it
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const trimmed = searchInput.trim()
    if (trimmed === search) return
    const timer = window.setTimeout(() => {
      setSearch(trimmed)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput, search])

  useEffect(() => {
    if (isStaff) return
    listAdminStaffMembers()
      .then(setProfessionals)
      .catch(() => {
        // The professional filter is simply hidden if this fails
      })
  }, [])

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
      staffMemberId: isStaff ? undefined : selectedStaff || undefined,
      search: search || undefined,
      ascending: isAscendingPeriod(period),
      ...getPeriodRange(period),
    }

    const load = isStaff ? staffListAppointments : adminListAppointments
    load(activeFilters, page, PAGE_SIZE)
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
  }, [period, selectedStatus, selectedStaff, search, page, isStaff, reloadKey])

  function handleStatusChange(value: string) {
    setSelectedStatus(value)
    setPage(1)
  }

  function handleStaffChange(value: string) {
    setSelectedStaff(value)
    setPage(1)
  }

  function handlePeriodChange(value: string) {
    setPeriod(value as AppointmentPeriod)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(result.totalCount / PAGE_SIZE))
  const isLastPage = page * PAGE_SIZE >= result.totalCount

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-shell-text">Turnos</h1>

      {/* Search by client */}
      <div className="relative">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar cliente por nombre, email o teléfono"
          aria-label="Buscar cliente"
          autoComplete="off"
          className="h-10 w-full rounded-xl border border-shell-border bg-white px-3 text-sm text-shell-text shadow-sm placeholder:text-shell-subtleText focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <FilterMenu
          label="Filtrar por período"
          options={PERIOD_OPTIONS}
          value={period}
          onSelect={handlePeriodChange}
        >
          {PERIOD_OPTIONS.find((o) => o.value === period)?.label}
          <span aria-hidden="true" className="text-xs text-shell-subtleText">▾</span>
        </FilterMenu>
        <FilterMenu
          label="Filtrar por estado"
          options={STATUS_OPTIONS}
          value={selectedStatus}
          onSelect={handleStatusChange}
          active={selectedStatus !== ''}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
          </svg>
          {selectedStatus !== '' && (
            <span className="text-xs text-brand-primary">
              {STATUS_OPTIONS.find((o) => o.value === selectedStatus)?.label}
            </span>
          )}
        </FilterMenu>
        {!isStaff && professionals.length > 0 && (
          <FilterMenu
            label="Filtrar por profesional"
            options={[
              { value: '', label: 'Todos los profesionales' },
              ...professionals.map((p) => ({ value: p.id, label: p.displayName })),
            ]}
            value={selectedStaff}
            onSelect={handleStaffChange}
            active={selectedStaff !== ''}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" />
            </svg>
            {selectedStaff !== '' && (
              <span className="max-w-[7rem] truncate text-xs text-brand-primary">
                {professionals.find((p) => p.id === selectedStaff)?.displayName}
              </span>
            )}
          </FilterMenu>
        )}
      </div>

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
          <p className="text-sm text-shell-subtleText">{search ? `No encontramos turnos para “${search}” con estos filtros.` : 'No hay turnos que coincidan con los filtros.'}</p>
        </div>
      )}

      {/* Cards */}
      {!loading && !error && result.rows.length > 0 && (
        <div className="shell-surface rounded-2xl border shadow-sm overflow-hidden">
          <ul className="space-y-2 p-3">
            {result.rows.map((row: AdminAppointmentRow) => (
              <li key={row.id}>
                <Link
                  to={`${basePath}/${row.id}`}
                  className={cn(
                    'block rounded-xl border border-l-4 px-3 py-2.5 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                    STATUS_CARD[row.status] ?? 'border-slate-200 bg-slate-50',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-shell-text">{row.customerName}</span>
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-shell-subtleText">
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-shell-subtleText">
                    {isStaff ? row.serviceName : `${row.serviceName} · ${row.staffDisplayName}`}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-shell-text">
                    {formatSlotDateTime(row.startsAt, orgTimezone)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

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

      {openAppointmentId && <AdminAppointmentDetailPage
          key={openAppointmentId}
          mode={mode}
          onChanged={() => setReloadKey((k) => k + 1)}
        />}
    </div>
  )
}
