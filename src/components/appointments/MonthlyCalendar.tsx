import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { toLocalDateKey } from '../../lib/formatSlotTime'
import type { AppointmentSummary } from '../../services/appointments'

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-50 text-red-700',
  completed: 'bg-blue-100 text-blue-800',
  no_show: 'bg-gray-100 text-gray-600',
}

/** Returns "YYYY-MM-DD" from a UTC Date */
function toUTCDateKey(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface MonthlyCalendarProps {
  appointments: AppointmentSummary[]
  orgTimezone: string
  currentDate?: Date
}

export function MonthlyCalendar({
  appointments,
  orgTimezone,
  currentDate: initialDate,
}: MonthlyCalendarProps) {
  const [viewYear, setViewYear] = useState(() => (initialDate ?? new Date()).getUTCFullYear())
  const [viewMonth, setViewMonth] = useState(() => (initialDate ?? new Date()).getUTCMonth())

  const viewDate = new Date(Date.UTC(viewYear, viewMonth, 1))

  const monthLabel = new Intl.DateTimeFormat('es', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(viewDate)

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  // First day of the month (UTC)
  const monthStart = new Date(Date.UTC(viewYear, viewMonth, 1))
  // Day of week of month start (0=Sun)
  const startDow = monthStart.getUTCDay()
  // Offset to Monday: if Sun (0), go back 6 days; else go back (startDow - 1)
  const offset = startDow === 0 ? 6 : startDow - 1
  const gridStart = new Date(monthStart.getTime() - offset * 86400000)

  // Build 42 cells (6 weeks × 7 days)
  const cells: Date[] = Array.from({ length: 42 }, (_, i) => {
    return new Date(gridStart.getTime() + i * 86400000)
  })

  // Group appointments by their local date in org timezone (not raw UTC slice)
  const byDate: Record<string, AppointmentSummary[]> = {}
  for (const apt of appointments) {
    const dateKey = toLocalDateKey(apt.startsAt, orgTimezone)
    if (!byDate[dateKey]) byDate[dateKey] = []
    byDate[dateKey].push(apt)
  }

  const todayKey = toUTCDateKey(new Date())

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={prevMonth}
          className="min-w-11 min-h-11 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-gray-700 capitalize">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="min-w-11 min-h-11 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center py-2">
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
        {cells.map((day) => {
          const dateKey = toUTCDateKey(day)
          const isCurrentMonth = day.getUTCMonth() === viewMonth
          const isToday = dateKey === todayKey
          const dayApts = byDate[dateKey] ?? []
          const overflow = dayApts.length > 3 ? dayApts.length - 3 : 0
          const visibleApts = dayApts.slice(0, 3)

          return (
            <div
              key={dateKey}
              className={cn('min-h-20 p-1', !isCurrentMonth && 'bg-gray-50')}
            >
              <p
                className={cn(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1',
                  isToday
                    ? 'bg-indigo-600 text-white'
                    : isCurrentMonth
                      ? 'text-gray-700'
                      : 'text-gray-300',
                )}
              >
                {day.getUTCDate()}
              </p>
              <div className="space-y-0.5">
                {visibleApts.map((apt) => {
                  const colorClass = STATUS_COLORS[apt.status] ?? 'bg-gray-100 text-gray-600'
                  return (
                    <Link
                      key={apt.id}
                      to={`/booking/confirmation/${apt.id}`}
                      className={cn('block text-xs px-1 py-0.5 rounded truncate', colorClass)}
                      title={apt.serviceName}
                    >
                      {apt.serviceName}
                    </Link>
                  )
                })}
                {overflow > 0 && (
                  <p className="text-xs text-gray-400 px-1">+{overflow} más</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
