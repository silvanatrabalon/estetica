import { useState } from 'react'
import { cn } from '../../lib/cn'
import { cancelAppointment } from '../../services/appointments'
import { ConfirmModal } from '../ConfirmModal'
import type { AdminAppointmentRow } from '../../services/adminAppointments'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-800',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
}

function formatDateTime(iso: string, orgTimezone: string): string {
  return new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: orgTimezone,
  }).format(new Date(iso))
}

interface AppointmentDetailPanelProps {
  appointment: AdminAppointmentRow | null
  orgTimezone: string
  onClose: () => void
  onCancelSuccess: (id: string) => void
}

export function AppointmentDetailPanel({
  appointment,
  orgTimezone,
  onClose,
  onCancelSuccess,
}: AppointmentDetailPanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  if (!appointment) return null

  const apt = appointment
  const durationMinutes = Math.round(
    (new Date(apt.endsAt).getTime() - new Date(apt.startsAt).getTime()) / 60000,
  )
  const canCancel = apt.status === 'pending' || apt.status === 'confirmed'

  async function handleCancel() {
    setCancelling(true)
    setCancelError(null)
    try {
      await cancelAppointment({ appointmentId: apt.id })
      onCancelSuccess(apt.id)
    } catch {
      setCancelError('No se pudo cancelar el turno. Intentá de nuevo.')
    } finally {
      setCancelling(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del turno"
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl flex flex-col',
          'animate-slide-in-right',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Detalle del turno</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Status badge */}
          <div>
            <span
              className={cn(
                'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium',
                STATUS_COLORS[apt.status] ?? 'bg-gray-100 text-gray-700',
              )}
            >
              {STATUS_LABELS[apt.status] ?? apt.status}
            </span>
          </div>

          {/* Fields */}
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Servicio</dt>
              <dd className="font-medium text-gray-900">{apt.serviceName}</dd>
            </div>
            {apt.staffDisplayName && (
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                  Profesional
                </dt>
                <dd className="text-gray-800">{apt.staffDisplayName}</dd>
              </div>
            )}
            {apt.customerName && (
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Cliente</dt>
                <dd className="text-gray-800">{apt.customerName}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Fecha y hora</dt>
              <dd className="text-gray-800 capitalize">
                {formatDateTime(apt.startsAt, orgTimezone)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Duración</dt>
              <dd className="text-gray-800">{durationMinutes} min</dd>
            </div>
          </dl>

          {cancelError && (
            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{cancelError}</p>
          )}
        </div>

        {/* Footer actions */}
        {canCancel && (
          <div className="px-5 py-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={cancelling}
              className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              {cancelling ? 'Cancelando...' : 'Cancelar turno'}
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title="Cancelar turno"
        message="¿Confirmás que querés cancelar este turno? Esta acción no se puede deshacer."
        destructive
        confirmLabel="Sí, cancelar"
        onConfirm={handleCancel}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
