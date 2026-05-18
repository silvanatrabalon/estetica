import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { formatSlotTime, toLocalDateKey } from '../../lib/formatSlotTime'
import {
  getTopPx,
  getHeightPx,
  getGridOpenMinutes,
  getGridHeightPx,
  PX_PER_MIN,
} from '../../lib/timeAxis'
import type { AppointmentSummary } from '../../services/appointments'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 border-yellow-300 text-yellow-900',
  confirmed: 'bg-green-100 border-green-300 text-green-900',
  cancelled: 'bg-red-50 border-red-200 text-red-700',
  completed: 'bg-blue-100 border-blue-200 text-blue-800',
  no_show: 'bg-gray-100 border-gray-200 text-gray-600',
}

function getAppointmentDurationMinutes(apt: AppointmentSummary): number {
  const startMs = new Date(apt.startsAt).getTime()
  const endMs = new Date(apt.endsAt).getTime()
  return Math.round((endMs - startMs) / 60000)
}

export interface DayViewProps {
  appointments: AppointmentSummary[]
  orgTimezone: string
  /** Grid open time in "HH:MM" format, e.g. "09:00" */
  openTime: string
  /** Grid close time in "HH:MM" format, e.g. "20:00" */
  closeTime: string
  selectedDate: Date
  loading?: boolean
  error?: string | null
  onDayChange: (date: Date) => void
}

export function DayView({
  appointments,
  orgTimezone,
  openTime,
  closeTime,
  selectedDate,
  loading = false,
  error = null,
  onDayChange,
}: DayViewProps) {
  const gridOpenMinutes = getGridOpenMinutes(openTime)
  const gridCloseMinutes = getGridOpenMinutes(closeTime)
  const gridHeightPx = getGridHeightPx(openTime, closeTime)

  const openHour = Math.floor(gridOpenMinutes / 60)
  const closeHour = Math.ceil(gridCloseMinutes / 60)
  const hourLabels = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i)

  // Filter appointments matching selectedDate in org timezone, sorted by start time
  const tz = orgTimezone || 'UTC'
  const selectedDateKey = toLocalDateKey(selectedDate.toISOString(), tz)
  const dayAppointments = appointments
    .filter((apt) => toLocalDateKey(apt.startsAt, tz) === selectedDateKey)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  const todayKey = toLocalDateKey(new Date().toISOString(), tz)
  const isToday = selectedDateKey === todayKey

  const dayLabel = new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: tz,
  }).format(selectedDate)

  function prevDay() {
    onDayChange(new Date(selectedDate.getTime() - 86400000))
  }
  function nextDay() {
    onDayChange(new Date(selectedDate.getTime() + 86400000))
  }
  function goToToday() {
    onDayChange(new Date())
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={prevDay}
          className="min-w-9 min-h-9 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 text-lg"
          aria-label="Día anterior"
        >
          ‹
        </button>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'text-sm font-medium capitalize',
              isToday ? 'text-indigo-600' : 'text-gray-700',
            )}
          >
            {dayLabel}
          </span>
          {!isToday && (
            <button
              onClick={goToToday}
              className="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
            >
              Hoy
            </button>
          )}
        </div>
        <button
          onClick={nextDay}
          className="min-w-9 min-h-9 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 text-lg"
          aria-label="Día siguiente"
        >
          ›
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div
          className="flex items-center justify-center"
          style={{ height: Math.max(gridHeightPx, 200) }}
        >
          <p className="text-gray-500 text-sm">Cargando turnos...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Time grid */}
      {!loading && !error && (
        <div className="overflow-y-auto max-h-[640px]">
          <div className="flex">
            {/* Time-label column */}
            <div
              className="relative flex-shrink-0 w-12 border-r border-gray-100"
              style={{ height: gridHeightPx }}
            >
              {hourLabels.map((hour, idx) => (
                <div
                  key={hour}
                  className="absolute right-1 text-xs text-gray-400 select-none leading-none"
                  style={{ top: idx * 60 * PX_PER_MIN - 6 }}
                >
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Day column */}
            <div
              className="relative flex-1"
              style={{ height: gridHeightPx }}
              data-testid="day-view-column"
            >
              {/* Hour grid lines */}
              {hourLabels.map((_, idx) => (
                <div
                  key={idx}
                  className="absolute left-0 right-0 border-t border-gray-100"
                  style={{ top: idx * 60 * PX_PER_MIN }}
                />
              ))}

              {/* Empty state */}
              {dayAppointments.length === 0 && (
                <p
                  className="absolute inset-0 flex items-center justify-center text-sm text-gray-400"
                  data-testid="day-view-empty"
                >
                  Sin turnos para este día
                </p>
              )}

              {/* Appointment blocks */}
              {dayAppointments.map((apt) => {
                const duration = getAppointmentDurationMinutes(apt)
                const top = getTopPx(apt.startsAt, gridOpenMinutes, tz)
                const height = getHeightPx(duration)
                const colorClass =
                  STATUS_COLORS[apt.status] ?? 'bg-gray-100 border-gray-200 text-gray-700'

                return (
                  <Link
                    key={apt.id}
                    to={`/booking/confirmation/${apt.id}`}
                    className={cn(
                      'absolute left-1 right-1 px-1.5 py-0.5 rounded border text-xs overflow-hidden block',
                      colorClass,
                    )}
                    style={{ top, height }}
                    title={`${apt.serviceName} · ${formatSlotTime(apt.startsAt, tz)}`}
                    data-testid="day-view-block"
                  >
                    <span className="font-medium block truncate">
                      {formatSlotTime(apt.startsAt, tz)}
                    </span>
                    <span className="block truncate">{apt.serviceName}</span>
                    {apt.customerName && (
                      <span className="block truncate text-xs opacity-75">
                        {apt.customerName}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
