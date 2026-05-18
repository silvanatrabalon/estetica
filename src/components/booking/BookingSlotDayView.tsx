import { cn } from '../../lib/cn'
import { formatSlotTime } from '../../lib/formatSlotTime'
import {
  getTopPx,
  getHeightPx,
  getGridOpenMinutes,
  getGridHeightPx,
  PX_PER_MIN,
} from '../../lib/timeAxis'
import type { AvailableSlot } from '../../services/availability'

export interface BookingSlotDayViewProps {
  slots: AvailableSlot[]
  selectedSlot: AvailableSlot | null
  onSelectSlot: (slot: AvailableSlot) => void
  orgTimezone: string
  openTime: string
  closeTime: string
  loading?: boolean
}

function getSlotDurationMinutes(slot: AvailableSlot): number {
  const startMs = new Date(slot.starts_at).getTime()
  const endMs = new Date(slot.ends_at).getTime()
  return Math.round((endMs - startMs) / 60000)
}

export function BookingSlotDayView({
  slots,
  selectedSlot,
  onSelectSlot,
  orgTimezone,
  openTime,
  closeTime,
  loading = false,
}: BookingSlotDayViewProps) {
  const gridOpenMinutes = getGridOpenMinutes(openTime)
  const gridCloseMinutes = getGridOpenMinutes(closeTime)
  const gridHeightPx = getGridHeightPx(openTime, closeTime)

  const openHour = Math.floor(gridOpenMinutes / 60)
  const closeHour = Math.ceil(gridCloseMinutes / 60)
  const hourLabels = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i)

  const tz = orgTimezone || 'UTC'

  // Loading skeleton
  if (loading) {
    return (
      <div
        className="rounded-lg border border-gray-200 overflow-hidden"
        data-testid="booking-slot-loading"
      >
        <div className="overflow-y-auto max-h-[640px]">
          <div className="flex">
            <div
              className="flex-shrink-0 w-14 border-r border-gray-100 animate-pulse bg-gray-50"
              style={{ height: gridHeightPx }}
            />
            <div
              className="flex-1 animate-pulse bg-gray-50"
              style={{ height: gridHeightPx }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-y-auto max-h-[640px]">
        <div className="flex">
          {/* Hour-label column */}
          <div
            className="relative flex-shrink-0 w-14 border-r border-gray-100"
            style={{ height: gridHeightPx }}
            data-testid="hour-labels"
          >
            {hourLabels.map((hour, idx) => (
              <div
                key={hour}
                className="absolute right-1 text-xs text-gray-400 select-none leading-none"
                style={{ top: idx * 60 * PX_PER_MIN - 6 }}
                data-testid={`hour-label-${hour}`}
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Slots column */}
          <div
            className="relative flex-1"
            style={{ height: gridHeightPx }}
            data-testid="booking-slot-column"
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
            {slots.length === 0 && (
              <p
                className="absolute inset-0 flex items-center justify-center text-sm text-gray-400"
                data-testid="booking-slot-empty"
              >
                No hay turnos disponibles para este día
              </p>
            )}

            {/* Slot blocks */}
            {slots.map((slot) => {
              const duration = getSlotDurationMinutes(slot)
              const top = getTopPx(slot.starts_at, gridOpenMinutes, tz)
              const height = getHeightPx(duration)
              const isSelected = slot.starts_at === selectedSlot?.starts_at

              return (
                <button
                  key={slot.starts_at}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className={cn(
                    'absolute left-1 right-1 px-2 py-1 rounded border text-xs text-left overflow-hidden transition-colors',
                    isSelected
                      ? 'bg-indigo-600 border-indigo-700 text-white font-medium'
                      : 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100',
                  )}
                  style={{ top, height }}
                  data-testid={isSelected ? 'slot-block-selected' : 'slot-block'}
                  aria-pressed={isSelected}
                >
                  <span className="font-semibold block">
                    {formatSlotTime(slot.starts_at, tz)}
                  </span>
                  <span className="opacity-80">{duration} min</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
