import { useState, useEffect, useCallback } from 'react'
import { adminListAppointments } from '../services/adminAppointments'
import { getBusinessSettings } from '../services/businessSettings'
import { TimeAxisWeeklyCalendar } from '../components/appointments/TimeAxisWeeklyCalendar'
import { DayView } from '../components/appointments/DayView'
import { AppointmentDetailPanel } from '../components/appointments/AppointmentDetailPanel'
import { cn } from '../lib/cn'
import { deriveGridTimes } from '../lib/businessHours'
import type { AppointmentSummary } from '../services/appointments'
import type { AdminAppointmentRow } from '../services/adminAppointments'

// ── Helpers ──────────────────────────────────────────────────────────────────

function toAppointmentSummary(row: AdminAppointmentRow, orgTimezone: string): AppointmentSummary {
  return {
    id: row.id,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    status: row.status,
    createdAt: row.createdAt,
    customerUserId: '',
    serviceId: row.serviceId,
    serviceName: row.serviceName,
    serviceDurationMinutes: 0,
    servicePriceCents: 0,
    staffDisplayName: row.staffDisplayName,
    orgName: '',
    orgTimezone,
    customerName: row.customerName,
  }
}

function getUTCMonday(date: Date): Date {
  const day = date.getUTCDay()
  const offset = day === 0 ? -6 : 1 - day
  return new Date(date.getTime() + offset * 86400000)
}

function startOfUTCDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addUTCDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86400000)
}

function toISODateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// ── AdminCalendarPage ────────────────────────────────────────────────────────

export function AdminCalendarPage() {
  // View state
  const [view, setView] = useState<'day' | 'week'>('week')
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())
  const [weekStart, setWeekStart] = useState(() => getUTCMonday(new Date()))

  // Appointments state
  const [appointments, setAppointments] = useState<AdminAppointmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedApt, setSelectedApt] = useState<AdminAppointmentRow | null>(null)

  // Business settings state (timezone + grid hours)
  const [orgTimezone, setOrgTimezone] = useState('America/Argentina/Buenos_Aires')
  const [openTime, setOpenTime] = useState('08:00')
  const [closeTime, setCloseTime] = useState('20:00')

  // Fetch business settings once on mount to resolve timezone and grid hours
  useEffect(() => {
    getBusinessSettings()
      .then((settings) => {
        setOrgTimezone(settings.timezone || 'America/Argentina/Buenos_Aires')
        const { openTime: open, closeTime: close } = deriveGridTimes(settings.weeklyHours)
        setOpenTime(open)
        setCloseTime(close)
      })
      .catch(() => {
        // Keep defaults on failure — calendar still usable
      })
  }, [])

  // Derive fetch date range based on current view
  const weekEnd = addUTCDays(weekStart, 6)
  const weekDateFrom = startOfUTCDay(weekStart).toISOString()
  const weekDateTo = `${toISODateString(weekEnd)}T23:59:59Z`

  // For day view, fetch ±1 day to safely cover timezone offsets; DayView filters to exact day
  const dayDateFrom = startOfUTCDay(addUTCDays(selectedDate, -1)).toISOString()
  const dayDateTo = `${toISODateString(addUTCDays(selectedDate, 1))}T23:59:59Z`

  const dateFrom = view === 'day' ? dayDateFrom : weekDateFrom
  const dateTo = view === 'day' ? dayDateTo : weekDateTo

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { rows } = await adminListAppointments({ dateFrom, dateTo }, 1, 200)
      setAppointments(rows)
    } catch {
      setError('Ocurrió un error al cargar el calendario.')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  function handleRescheduleSuccess(appointmentId: string, newStartsAt: string) {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, startsAt: newStartsAt } : apt)),
    )
  }

  function handleAppointmentClick(id: string) {
    const apt = appointments.find((a) => a.id === id)
    if (apt) setSelectedApt(apt)
  }

  function handleCancelSuccess(id: string) {
    setAppointments((prev) => prev.filter((a) => a.id !== id))
    setSelectedApt(null)
  }

  function handleWeekChange(newWeekStart: Date) {
    setWeekStart(newWeekStart)
  }

  function handleDayChange(date: Date) {
    setSelectedDate(date)
  }

  const summaries = appointments.map((row) => toAppointmentSummary(row, orgTimezone))

  const showDayView = view === 'day'
  const showWeekEmptyState = !loading && !error && appointments.length === 0 && view === 'week'

  return (
    <>
    <div className="space-y-4">
      {/* Page header with view toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendario</h2>
          {view === 'week' && summaries.some(apt => apt.status === 'pending' || apt.status === 'confirmed') && (
            <p className="text-xs text-gray-400 italic mt-0.5">Arrastrá un turno para reprogramarlo</p>
          )}
        </div>

        <div
          className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5"
          role="group"
          aria-label="Modo de vista"
        >
          <button
            onClick={() => setView('week')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
              view === 'week'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
            aria-pressed={view === 'week'}
            data-testid="view-toggle-week"
          >
            Semana
          </button>
          <button
            onClick={() => setView('day')}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md font-medium transition-colors',
              view === 'day'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
            aria-pressed={view === 'day'}
            data-testid="view-toggle-day"
          >
            Día
          </button>
        </div>
      </div>

      {/* Loading state (week view) */}
      {loading && !showDayView && (
        <div className="flex items-center justify-center min-h-32">
          <p className="text-gray-500">Cargando turnos...</p>
        </div>
      )}

      {/* Error state (week view) */}
      {!loading && error && !showDayView && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Week view: empty state */}
      {showWeekEmptyState && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay turnos esta semana.</p>
        </div>
      )}

      {/* Week view: calendar */}
      {!loading && !error && view === 'week' && (
        <TimeAxisWeeklyCalendar
          appointments={summaries}
          orgTimezone={orgTimezone}
          openTime={openTime}
          closeTime={closeTime}
          currentDate={weekStart}
          showCustomerName={true}
          onRescheduleSuccess={handleRescheduleSuccess}
          onWeekChange={handleWeekChange}
          onAppointmentClick={handleAppointmentClick}
        />
      )}

      {/* Day view: always rendered when view === 'day', with its own loading/error/nav */}
      {showDayView && (
        <DayView
          appointments={summaries}
          orgTimezone={orgTimezone}
          openTime={openTime}
          closeTime={closeTime}
          selectedDate={selectedDate}
          loading={loading}
          error={error}
          onDayChange={handleDayChange}
          onAppointmentClick={handleAppointmentClick}
        />
      )}
    </div>

    <AppointmentDetailPanel
      appointment={selectedApt}
      orgTimezone={orgTimezone}
      onClose={() => setSelectedApt(null)}
      onCancelSuccess={handleCancelSuccess}
    />
  </>
  )
}