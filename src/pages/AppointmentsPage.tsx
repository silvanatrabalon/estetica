import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAppointments } from '../hooks/useAppointments'
import { cn } from '../lib/cn'
import { PERIOD_OPTIONS, getPeriodRange, isAscendingPeriod, type AppointmentPeriod } from '../lib/appointmentPeriods'
import { STATUS_CARD, STATUS_LABELS } from '../lib/appointmentStatus'
import { formatSlotDateTime } from '../lib/formatSlotTime'
import { FilterMenu } from '../components/FilterMenu'
import { CustomerAppointmentDetail } from '../components/appointments/CustomerAppointmentDetail'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'completed', label: 'Completado' },
]

/** Mis turnos: the same screen as the professional's Turnos (search, period and state filters, cards), with only the client's own. */
export function AppointmentsPage() {
  const navigate = useNavigate()
  // /appointments/:id opens the detail as a pop-up over this list
  const { id: openAppointmentId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { appointments, loading, error, setAppointments } = useAppointments({ scope: 'customer' })
  // A client mostly wants what is coming, so that is where it starts (the professional's list starts on today)
  const [period, setPeriod] = useState<AppointmentPeriod>(() => {
    const fromUrl = searchParams.get('periodo')
    return PERIOD_OPTIONS.some((o) => o.value === fromUrl) ? (fromUrl as AppointmentPeriod) : 'upcoming'
  })
  const [status, setStatus] = useState(() => {
    const fromUrl = searchParams.get('estado')
    return STATUS_OPTIONS.some((o) => o.value !== '' && o.value === fromUrl) ? (fromUrl as string) : ''
  })
  const [search, setSearch] = useState('')

  const shown = useMemo(() => {
    const { dateFrom, dateTo } = getPeriodRange(period)
    const wanted = search.trim().toLowerCase()
    const ascending = isAscendingPeriod(period)
    return appointments
      .filter((apt) => (dateFrom ? apt.startsAt >= dateFrom : true))
      .filter((apt) => (dateTo ? apt.startsAt <= dateTo : true))
      .filter((apt) => (status === '' ? true : apt.status === status))
      .filter((apt) =>
        wanted === '' ? true : `${apt.serviceName} ${apt.staffDisplayName}`.toLowerCase().includes(wanted),
      )
      .sort((a, b) => (ascending ? a.startsAt.localeCompare(b.startsAt) : b.startsAt.localeCompare(a.startsAt)))
  }, [appointments, period, status, search])

  const searched = search.trim()

  function handleCancelSuccess(appointmentId: string) {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt)),
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-heading text-2xl font-semibold text-shell-text">Mis turnos</h1>

      {/* Search */}
      <div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por servicio o profesional"
          aria-label="Buscar turno"
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
          onSelect={(value) => setPeriod(value as AppointmentPeriod)}
        >
          {PERIOD_OPTIONS.find((o) => o.value === period)?.label}
          <span aria-hidden="true" className="text-xs text-shell-subtleText">▾</span>
        </FilterMenu>
        <FilterMenu
          label="Filtrar por estado"
          options={STATUS_OPTIONS}
          value={status}
          onSelect={setStatus}
          active={status !== ''}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
          </svg>
          {status !== '' && (
            <span className="text-xs text-brand-primary">{STATUS_OPTIONS.find((o) => o.value === status)?.label}</span>
          )}
        </FilterMenu>
      </div>

      {loading && <p className="py-10 text-center text-sm text-shell-subtleText">Cargando turnos...</p>}

      {!loading && error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && shown.length === 0 && (
        <div className="shell-surface rounded-2xl border py-14 text-center shadow-sm">
          <p className="text-sm text-shell-subtleText">
            {searched ? `No encontramos turnos para “${searched}” con estos filtros.` : 'No hay turnos que coincidan con los filtros.'}
          </p>
        </div>
      )}

      {!loading && !error && shown.length > 0 && (
        <div className="shell-surface overflow-hidden rounded-2xl border shadow-sm">
          <ul className="space-y-2 p-3">
            {shown.map((apt) => (
              <li key={apt.id}>
                <Link
                  to={`/appointments/${apt.id}`}
                  className={cn(
                    'block rounded-xl border border-l-4 px-3 py-2.5 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                    STATUS_CARD[apt.status] ?? 'border-slate-200 bg-slate-50',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-shell-text">{apt.serviceName}</span>
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-shell-subtleText">
                      {STATUS_LABELS[apt.status] ?? apt.status}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-shell-subtleText">con {apt.staffDisplayName}</p>
                  <p className="mt-0.5 text-xs font-medium text-shell-text">
                    {formatSlotDateTime(apt.startsAt, apt.orgTimezone)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {openAppointmentId && (
        <CustomerAppointmentDetail
          key={openAppointmentId}
          appointment={appointments.find((apt) => apt.id === openAppointmentId) ?? null}
          onClose={() => navigate('/appointments')}
          onCancelled={handleCancelSuccess}
        />
      )}
    </div>
  )
}
