import { useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { formatSlotTime } from '../../lib/formatSlotTime'
import type { AppointmentSummary } from '../../services/appointments'
import { cancelAppointment } from '../../services/appointments'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
  no_show: 'No asistió',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-800',
  no_show: 'bg-gray-100 text-gray-600',
}

function formatAppointmentDate(isoUtc: string, orgTimezone: string): string {
  let timezone = 'UTC'
  if (orgTimezone) {
    try {
      Intl.DateTimeFormat('es', { timeZone: orgTimezone })
      timezone = orgTimezone
    } catch {
      // fall back to UTC
    }
  }
  return new Intl.DateTimeFormat('es', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(isoUtc))
}

interface AppointmentCardProps {
  appointment: AppointmentSummary
  showCustomerName: boolean
  showRescheduleAction?: boolean
  showCancelAction?: boolean
  onCancelSuccess?: (appointmentId: string) => void
}

export function AppointmentCard({
  appointment,
  showCustomerName,
  showRescheduleAction = false,
  showCancelAction = false,
  onCancelSuccess,
}: AppointmentCardProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const bookingRef = appointment.id.slice(-8).toUpperCase()
  const statusLabel = STATUS_LABELS[appointment.status] ?? appointment.status
  const statusColor = STATUS_COLORS[appointment.status] ?? 'bg-gray-100 text-gray-600'
  const dateStr = formatAppointmentDate(appointment.startsAt, appointment.orgTimezone)
  const timeStr = formatSlotTime(appointment.startsAt, appointment.orgTimezone)
  const secondaryName = showCustomerName
    ? (appointment.customerName ?? '—')
    : appointment.staffDisplayName

  const canReschedule =
    showRescheduleAction &&
    (appointment.status === 'pending' || appointment.status === 'confirmed')

  const canCancel =
    showCancelAction &&
    (appointment.status === 'pending' || appointment.status === 'confirmed')

  async function handleConfirmCancel() {
    setCancelLoading(true)
    setCancelError(null)
    try {
      await cancelAppointment({ appointmentId: appointment.id })
      setShowDialog(false)
      onCancelSuccess?.(appointment.id)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Ocurrió un error al cancelar el turno.')
    } finally {
      setCancelLoading(false)
    }
  }

  function handleOpenDialog() {
    setCancelError(null)
    setShowDialog(true)
  }

  function handleCloseDialog() {
    if (cancelLoading) return
    setShowDialog(false)
    setCancelError(null)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
      <Link
        to={`/booking/confirmation/${appointment.id}`}
        className="block p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{appointment.serviceName}</p>
            <p className="text-sm text-gray-600 mt-0.5 capitalize">
              {dateStr} · {timeStr}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{secondaryName}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColor)}>
              {statusLabel}
            </span>
            <span className="text-xs text-gray-400 font-mono">#{bookingRef}</span>
          </div>
        </div>
      </Link>
      {(canReschedule || canCancel) && (
        <div className="px-4 pb-3 flex items-center gap-4">
          {canReschedule && (
            <Link
              to={`/appointments/${appointment.id}/reschedule`}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Reprogramar
            </Link>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={handleOpenDialog}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              Cancelar
            </button>
          )}
        </div>
      )}

      {showDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h2 id="cancel-dialog-title" className="text-base font-semibold text-gray-900">
              ¿Cancelar este turno?
            </h2>
            <p className="text-sm text-gray-600">Esta acción no se puede deshacer.</p>
            {cancelError && (
              <p className="text-sm text-red-600">{cancelError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleCloseDialog}
                disabled={cancelLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {cancelLoading ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
