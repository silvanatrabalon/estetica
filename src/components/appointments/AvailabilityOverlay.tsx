import type { StaffScheduleDay, StaffScheduleException } from '../../services/staffAvailability'

export interface BusinessClosureException {
  date: string
  reason?: string | null
}

export interface AvailabilityOverlayData {
  scheduleByDay: Record<number, StaffScheduleDay | null>
  exceptionsByDate: Record<string, StaffScheduleException>
  businessClosures: BusinessClosureException[]
}

interface AvailabilityOverlayProps extends AvailabilityOverlayData {
  date: string // "YYYY-MM-DD"
}

/**
 * Renders a subtle background overlay in a WeeklyCalendar day column to indicate
 * staff availability. Must be rendered inside a `position: relative` container.
 */
export function AvailabilityOverlay({
  date,
  scheduleByDay,
  exceptionsByDate,
  businessClosures,
}: AvailabilityOverlayProps) {
  // Check business closure first (highest priority)
  const isClosed = businessClosures.some((c) => c.date === date)
  if (isClosed) {
    const closure = businessClosures.find((c) => c.date === date)
    return (
      <div className="absolute inset-0 bg-red-50 opacity-60 flex items-start justify-center pt-2 pointer-events-none z-0">
        <span className="text-xs font-medium text-red-500">Cerrado</span>
        {closure?.reason && (
          <span className="sr-only">{closure.reason}</span>
        )}
      </div>
    )
  }

  // Check staff schedule exception
  const exception = exceptionsByDate[date]
  if (exception) {
    if (exception.exceptionType === 'day_off') {
      return (
        <div className="absolute inset-0 bg-gray-100 opacity-60 flex items-start justify-center pt-2 pointer-events-none z-0">
          <span className="text-xs font-medium text-gray-500">Día libre</span>
        </div>
      )
    }
    // custom_hours — show as working (light indigo)
    return (
      <div className="absolute inset-0 bg-indigo-50 opacity-40 pointer-events-none z-0" />
    )
  }

  // Check regular schedule for this day of week
  // date is "YYYY-MM-DD"; compute day of week (0=Sun, 1=Mon, ...)
  const [year, month, day] = date.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  const dayOfWeek = d.getUTCDay()

  const schedule = scheduleByDay[dayOfWeek]
  if (!schedule || !schedule.isWorking) {
    return (
      <div className="absolute inset-0 bg-gray-50 opacity-60 pointer-events-none z-0" />
    )
  }

  // Working day — light indigo shading
  return (
    <div className="absolute inset-0 bg-indigo-50 opacity-30 pointer-events-none z-0" />
  )
}
