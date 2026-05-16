import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { formatSlotTime } from '../../lib/formatSlotTime'
import type { AppointmentSummary } from '../../services/appointments'

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 border-yellow-300 text-yellow-900',
  confirmed: 'bg-green-100 border-green-300 text-green-900',
  cancelled: 'bg-red-50 border-red-200 text-red-700',
  completed: 'bg-blue-100 border-blue-200 text-blue-800',
  no_show: 'bg-gray-100 border-gray-200 text-gray-600',
}

/** Returns the Monday (UTC) of the week containing the given date */
function getUTCMonday(date: Date): Date {
  const day = date.getUTCDay() // 0=Sun
  const offset = day === 0 ? -6 : 1 - day
  return new Date(date.getTime() + offset * 86400000)
}

function addUTCDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86400000)
}

/** Returns "YYYY-MM-DD" from a UTC Date */
function toUTCDateKey(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface WeeklyCalendarProps {
  appointments: AppointmentSummary[]
  orgTimezone: string
  currentDate?: Date
}

export function WeeklyCalendar({
  appointments,
  orgTimezone,
  currentDate: initialDate,
}: WeeklyCalendarProps) {
  const [weekStart, setWeekStart] = useState(() =>
    getUTCMonday(initialDate ?? new Date()),
  )

  const days = Array.from({ length: 7 }, (_, i) => addUTCDays(weekStart, i))

  const startLabel = new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(weekStart)
  const endLabel = new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(days[6])
  const weekLabel = `${startLabel} – ${endLabel}`

  function prevWeek() {
    setWeekStart((d) => addUTCDays(d, -7))
  }
  function nextWeek() {
    setWeekStart((d) => addUTCDays(d, 7))
  }

  // Group appointments by their UTC date (first 10 chars of ISO string)
  const byDate: Record<string, AppointmentSummary[]> = {}
  for (const apt of appointments) {
    const dateKey = apt.startsAt.slice(0, 10)
    if (!byDate[dateKey]) byDate[dateKey] = []
    byDate[dateKey].push(apt)
  }

  const todayKey = toUTCDateKey(new Date())

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button
          onClick={prevWeek}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          aria-label="Semana anterior"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-gray-700 capitalize">{weekLabel}</span>
        <button
          onClick={nextWeek}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          aria-label="Semana siguiente"
        >
          ›
        </button>
      </div>

      {/* Day header row */}
      <div className="grid grid-cols-7 border-b border-gray-100 divide-x divide-gray-100">
        {days.map((day, i) => {
          const dateKey = toUTCDateKey(day)
          const isToday = dateKey === todayKey
          return (
            <div key={dateKey} className={cn('text-center py-2', isToday && 'bg-indigo-50')}>
              <p className="text-xs text-gray-500">{DAY_LABELS[i]}</p>
              <p
                className={cn(
                  'text-sm font-semibold',
                  isToday ? 'text-indigo-600' : 'text-gray-700',
                )}
              >
                {day.getUTCDate()}
              </p>
            </div>
          )
        })}
      </div>

      {/* Appointment blocks */}
      <div className="grid grid-cols-7 divide-x divide-gray-100">
        {days.map((day) => {
          const dateKey = toUTCDateKey(day)
          const dayAppointments = byDate[dateKey] ?? []
          return (
            <div key={dateKey} className="min-h-32 p-1 space-y-1">
              {dayAppointments.map((apt) => {
                const colorClass =
                  STATUS_COLORS[apt.status] ?? 'bg-gray-100 border-gray-200 text-gray-700'
                return (
                  <Link
                    key={apt.id}
                    to={`/booking/confirmation/${apt.id}`}
                    className={cn(
                      'block text-xs px-1.5 py-1 rounded border truncate',
                      colorClass,
                    )}
                    title={`${apt.serviceName} · ${formatSlotTime(apt.startsAt, orgTimezone)}`}
                  >
                    <span className="font-medium">
                      {formatSlotTime(apt.startsAt, orgTimezone)}
                    </span>
                    <span className="block truncate">{apt.serviceName}</span>
                  </Link>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
