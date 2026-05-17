import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { formatSlotTime } from '../../lib/formatSlotTime'
import type { AppointmentSummary } from '../../services/appointments'

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
}

export function AppointmentCard({ appointment, showCustomerName, showRescheduleAction = false }: AppointmentCardProps) {
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
      {canReschedule && (
        <div className="px-4 pb-3">
          <Link
            to={`/appointments/${appointment.id}/reschedule`}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Reprogramar
          </Link>
        </div>
      )}
    </div>
  )
}
