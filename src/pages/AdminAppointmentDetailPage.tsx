import { useCallback, useEffect, useState } from 'react'
import { Select } from '../components/Select'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmModal } from '../components/ConfirmModal'
import { DetailPopup } from '../components/appointments/DetailPopup'
import { formatPriceARS } from '../lib/formatPrice'
import { formatSlotDateTime } from '../lib/formatSlotTime'
import {
  adminUpdateAppointment,
  getAdminAppointment,
  getStaffAppointment,
  listStaffForService,
  type AdminAppointmentDetail,
  type StaffOption,
} from '../services/adminAppointments'
import { cancelAppointment } from '../services/appointments'
import { listServices, type Service } from '../services/adminServices'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  completed: 'Completado',
  no_show: 'No asistió',
}

// A completed appointment (its time passed) can still be edited, cancelled or rescheduled
const ACTIONABLE = ['pending', 'confirmed', 'completed']

interface AppointmentDetailPageProps {
  /** admin: full actions (reprogramar, editar, cancelar). staff: own appointments, no editing. */
  mode?: 'admin' | 'staff'
  /** Called after the appointment was edited or cancelled, so the list behind can refresh. */
  onChanged?: () => void
}

export function AdminAppointmentDetailPage({ mode = 'admin', onChanged }: AppointmentDetailPageProps) {
  const listPath = mode === 'staff' ? '/staff/appointments' : '/admin/appointments'
  const detailPath = (appointmentId: string) => `${listPath}/${appointmentId}`
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const closePopup = useCallback(() => navigate(listPath), [navigate, listPath])

  const [appointment, setAppointment] = useState<AdminAppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const [editing, setEditing] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([])
  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setLoadError(null)
    try {
      setAppointment(await (mode === 'staff' ? getStaffAppointment(id) : getAdminAppointment(id)))
    } catch {
      setLoadError('No pudimos cargar el turno.')
    } finally {
      setLoading(false)
    }
  }, [id, mode])

  useEffect(() => {
    void load()
  }, [load])

  async function startEditing() {
    if (!appointment) return
    setFeedback(null)
    try {
      const [allServices, staff] = await Promise.all([
        listServices(),
        listStaffForService(appointment.serviceId),
      ])
      setServices(allServices.filter((s) => s.isActive || s.id === appointment.serviceId))
      setStaffOptions(staff)
      setServiceId(appointment.serviceId)
      setStaffId(appointment.staffMemberId)
      setEditing(true)
    } catch {
      setFeedback({ type: 'error', text: 'No pudimos abrir la edición. Intentá de nuevo.' })
    }
  }

  async function handleServiceChange(newServiceId: string) {
    setServiceId(newServiceId)
    setStaffId('')
    setStaffOptions([])
    try {
      const staff = await listStaffForService(newServiceId)
      setStaffOptions(staff)
      // Keep the current professional when they also do the new service.
      if (appointment && staff.some((s) => s.staffMemberId === appointment.staffMemberId)) {
        setStaffId(appointment.staffMemberId)
      }
    } catch {
      setFeedback({ type: 'error', text: 'No pudimos cargar los profesionales del servicio.' })
    }
  }

  async function handleSave() {
    if (!appointment || !staffId) return
    setSaving(true)
    setFeedback(null)
    try {
      await adminUpdateAppointment({
        appointmentId: appointment.id,
        serviceId,
        staffMemberId: staffId,
        // Notes are not editable here: keep whatever the appointment already has.
        notes: appointment.notes ?? '',
      })
      setEditing(false)
      onChanged?.()
      await load()
      setFeedback({ type: 'success', text: 'Cambios guardados.' })
    } catch (err) {
      setFeedback({ type: 'error', text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel() {
    if (!appointment) return
    setCancelling(true)
    setFeedback(null)
    try {
      await cancelAppointment({ appointmentId: appointment.id })
      setConfirmCancel(false)
      onChanged?.()
      await load()
      setFeedback({ type: 'success', text: 'El turno fue cancelado.' })
    } catch (err) {
      setConfirmCancel(false)
      setFeedback({ type: 'error', text: (err as Error).message })
    } finally {
      setCancelling(false)
    }
  }

  const backLink = (
    <Link
      to={listPath}
      aria-label="Volver a turnos"
      className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-xl text-shell-subtleText hover:bg-shell-muted"
    >
      ✕
    </Link>
  )

  if (loading && !appointment) {
    return (
      <DetailPopup onClose={closePopup}>
        <p className="py-10 text-center text-sm text-shell-subtleText">Cargando turno...</p>
      </DetailPopup>
    )
  }

  if (loadError) {
    return (
      <DetailPopup onClose={closePopup}>
        <div className="flex">{backLink}</div>
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {loadError}
        </div>
      </DetailPopup>
    )
  }

  if (!appointment) {
    return (
      <DetailPopup onClose={closePopup}>
        <div className="flex">{backLink}</div>
        <div className="rounded-2xl border border-shell-border py-14 text-center">
          <p className="text-sm text-shell-subtleText">No encontramos este turno.</p>
        </div>
      </DetailPopup>
    )
  }

  const actionable = ACTIONABLE.includes(appointment.status)
  const canSave = !saving && !!staffId && !!serviceId

  return (
    <DetailPopup onClose={closePopup}>
      <div className="flex items-center gap-2">
        <h1 className="font-heading text-xl font-semibold text-shell-text">Detalle del turno</h1>
        {backLink}
      </div>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={
            feedback.type === 'error'
              ? 'rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700'
              : 'rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-700'
          }
        >
          {feedback.text}
        </div>
      )}

      {actionable && !editing && (
        <div className={`grid gap-2 sm:max-w-md ${mode === 'admin' ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <button
            type="button"
            onClick={() =>
              navigate(`/appointments/${appointment.id}/reschedule`, {
                state: { returnTo: detailPath(appointment.id) },
              })
            }
            className="rounded-lg bg-brand-primary px-2 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Reprogramar
          </button>
          {mode === 'admin' && (
          <button
            type="button"
            onClick={() => void startEditing()}
            className="rounded-lg border border-shell-border bg-white px-2 py-2 text-sm font-medium text-shell-text hover:bg-shell-muted"
          >
            Editar
          </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="rounded-lg border border-red-200 bg-white px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Cancelar
          </button>
        </div>
      )}

      {actionable && editing && (
        <section className="shell-surface space-y-4 rounded-2xl border p-5 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-shell-subtleText">Editar turno</h2>
          <p className="text-sm text-shell-subtleText">
            Para cambiar el día o la hora usá “Reprogramar”.
          </p>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-shell-subtleText">Servicio</span>
            <Select
              aria-label="Servicio"
              value={serviceId}
              onChange={(e) => void handleServiceChange(e.target.value)}
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-shell-subtleText">Profesional</span>
            <Select aria-label="Profesional" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">Elegí un profesional</option>
              {staffOptions.map((s) => (
                <option key={s.staffMemberId} value={s.staffMemberId}>
                  {s.displayName}
                </option>
              ))}
            </Select>
            {staffOptions.length === 0 && (
              <span className="text-xs text-shell-subtleText">
                Ningún profesional activo realiza este servicio.
              </span>
            )}
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={!canSave}
              onClick={() => void handleSave()}
              className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => setEditing(false)}
              className="rounded-lg border border-shell-border bg-white px-4 py-2 text-sm font-medium text-shell-text hover:bg-shell-muted"
            >
              Descartar
            </button>
          </div>
        </section>
      )}

      <section className="shell-surface rounded-2xl border p-4 shadow-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <Field label="Cliente" value={appointment.customerName} />
          <Field label="Estado" value={STATUS_LABELS[appointment.status] ?? appointment.status} />
          <Field label="Fecha y hora" value={formatSlotDateTime(appointment.startsAt, appointment.orgTimezone)} wide />
          <Field label="Servicio" value={appointment.serviceName} />
          <Field label="Profesional" value={appointment.staffDisplayName} />
          <Field label="Duración" value={`${appointment.serviceDurationMinutes} min`} />
          <Field label="Precio" value={formatPriceARS(appointment.servicePriceCents)} />
          {appointment.customerEmail && <Field label="Email" value={appointment.customerEmail} wide />}
          {appointment.customerPhone && <Field label="Teléfono" value={appointment.customerPhone} />}
          {appointment.notes && <Field label="Nota interna" value={appointment.notes} wide />}
        </dl>
      </section>

      {!actionable && (
        <p className="text-sm text-shell-subtleText">
          Este turno ya no se puede modificar porque está {STATUS_LABELS[appointment.status]?.toLowerCase() ?? appointment.status}.
        </p>
      )}

      <ConfirmModal
        isOpen={confirmCancel}
        title="Cancelar turno"
        message={`¿Cancelar el turno de ${appointment.customerName}? Se le avisará por email al cliente y al profesional.`}
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
