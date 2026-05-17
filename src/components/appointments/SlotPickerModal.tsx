import { formatSlotTime } from '../../lib/formatSlotTime'
import { useAvailableSlots } from '../../hooks/useAvailableSlots'

interface SlotPickerModalProps {
  serviceId: string
  date: string
  orgTimezone: string
  onConfirm: (startsAt: string) => void
  onClose: () => void
  confirming?: boolean
  error?: string | null
}

export function SlotPickerModal({
  serviceId,
  date,
  orgTimezone,
  onConfirm,
  onClose,
  confirming = false,
  error = null,
}: SlotPickerModalProps) {
  const { slots, loading, error: slotsError } = useAvailableSlots(serviceId, date)

  const dateLabel = new Intl.DateTimeFormat('es', {
    timeZone: orgTimezone || 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(date + 'T12:00:00'))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slot-picker-title"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <h2
          id="slot-picker-title"
          className="text-lg font-semibold text-gray-900 mb-1"
        >
          Elegí un horario
        </h2>
        <p className="text-sm text-gray-500 mb-4 capitalize">{dateLabel}</p>

        {/* Loading state */}
        {loading && (
          <p className="text-sm text-gray-500 animate-pulse py-4 text-center">
            Buscando horarios disponibles…
          </p>
        )}

        {/* Slots fetch error */}
        {!loading && slotsError && (
          <p className="text-sm text-red-600 py-4 text-center">{slotsError}</p>
        )}

        {/* Empty state */}
        {!loading && !slotsError && slots.length === 0 && (
          <p className="text-sm text-gray-500 py-4 text-center">
            No hay horarios disponibles para esta fecha. Elegí otro día.
          </p>
        )}

        {/* Slot grid */}
        {!loading && !slotsError && slots.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.starts_at}
                type="button"
                onClick={() => onConfirm(slot.starts_at)}
                disabled={confirming}
                className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm font-medium text-gray-800 hover:bg-indigo-50 hover:border-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formatSlotTime(slot.starts_at, orgTimezone)}
              </button>
            ))}
          </div>
        )}

        {/* Confirm/reschedule error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
