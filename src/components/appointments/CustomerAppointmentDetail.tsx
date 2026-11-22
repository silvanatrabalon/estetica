import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmModal } from '../ConfirmModal'
import { DetailPopup } from './DetailPopup'
import { STATUS_LABELS } from '../../lib/appointmentStatus'
import { formatPriceARS } from '../../lib/formatPrice'
import { formatSlotDateTime } from '../../lib/formatSlotTime'
import { cancelAppointment, type AppointmentSummary } from '../../services/appointments'

interface CustomerAppointmentDetailProps {
  /** The client's appointment; null when the link points to one that is not theirs or no longer exists. */
  appointment: AppointmentSummary | null
  /** Where the X goes back to (the list). */
  onClose: () => void
  /** Called after cancelling, so the list behind can show it. */
  onCancelled: (appointmentId: string) => void
}

/** A client's appointment in a pop-up over their list: its data, and rescheduling and cancelling while it is still to come. */
export function CustomerAppointmentDetail({ appointment, onClose, onCancelled }: CustomerAppointmentDetailProps) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      aria-label="Volver a mis turnos"
      className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-xl text-shell-subtleText hover:bg-shell-muted"
    >
      ✕
    </button>
  )

  if (!appointment) {
    return (
      <DetailPopup onClose={onClose}>
        <div className="flex">{closeButton}</div>
        <div className="rounded-2xl border border-shell-border py-14 text-center">
          <p className="text-sm text-shell-subtleText">No encontramos este turno.</p>
        </div>
      </DetailPopup>
    )
  }

  const isToCome =
    (appointment.status === 'pending' || appointment.status === 'confirmed') &&
    new Date(appointment.startsAt) > new Date()

  async function handleCancel() {
    if (!appointment) return
    setCancelling(true)
    setError(null)
    try {
      await cancelAppointment({ appointmentId: appointment.id })
      setConfirmCancel(false)
      onCancelled(appointment.id)
    } catch (err) {
      setConfirmCancel(false)
      setError(err instanceof Error ? err.message : 'Ocurrió un error al cancelar el turno.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <DetailPopup onClose={onClose}>
      <div className="flex items-center gap-2">
        <h1 className="font-heading text-xl font-semibold text-shell-text">Detalle del turno</h1>
        {closeButton}
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isToCome && (
        <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
          <Link
            to={`/appointments/${appointment.id}/reschedule`}
            state={{ returnTo: `/appointments/${appointment.id}` }}
            className="rounded-lg bg-brand-primary px-2 py-2 text-center text-sm font-medium text-white hover:opacity-90"
          >
            Reprogramar
          </Link>
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="rounded-lg border border-red-200 bg-white px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Cancelar
          </button>
        </div>
      )}

      <section className="shell-surface rounded-2xl border p-4 shadow-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <Field label="Estado" value={STATUS_LABELS[appointment.status] ?? appointment.status} />
          <Field label="Fecha y hora" value={formatSlotDateTime(appointment.startsAt, appointment.orgTimezone)} wide />
          <Field label="Servicio" value={appointment.serviceName} />
          <Field label="Profesional" value={appointment.staffDisplayName} />
          <Field label="Duración" value={`${appointment.serviceDurationMinutes} min`} />
          <Field label="Precio" value={formatPriceARS(appointment.servicePriceCents)} />
          <Field label="Reserva" value={`#${appointment.id.slice(-8).toUpperCase()}`} />
        </dl>
      </section>

      <p className="text-center text-sm">
        <Link to={`/booking/confirmation/${appointment.id}`} className="font-semibold text-brand-primary hover:underline">
          Ver confirmación
        </Link>
      </p>

      {!isToCome && appointment.status !== 'cancelled' && (
        <p className="text-sm text-shell-subtleText">Este turno ya no se puede modificar.</p>
      )}

      <ConfirmModal
        isOpen={confirmCancel}
        title="Cancelar turno"
        message="¿Cancelar este turno? Esta acción no se puede deshacer."
        confirmLabel={cancelling ? 'Cancelando...' : 'Sí, cancelar'}
        cancelLabel="Volver"
        destructive
        onConfirm={() => void handleCancel()}
        onCancel={() => setConfirmCancel(false)}
      />
    </DetailPopup>
  )
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2 sm:col-span-1' : undefined}>
      <dt className="text-xs font-medium text-shell-subtleText">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap break-words text-shell-text">{value}</dd>
    </div>
  )
}
