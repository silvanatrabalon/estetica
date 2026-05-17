import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAvailableSlots } from '../hooks/useAvailableSlots'
import { formatSlotTime } from '../lib/formatSlotTime'
import { getBusinessSettings } from '../services/businessSettings'
import { getAppointment, rescheduleAppointment } from '../services/appointments'
import type { AppointmentDetail } from '../services/appointments'

type Step = 'picker' | 'confirm'

function addDays(date: Date, days: number): string {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result.toISOString().slice(0, 10)
}

export function ReschedulePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null)
  const [loadingAppointment, setLoadingAppointment] = useState(true)
  const [appointmentError, setAppointmentError] = useState<string | null>(null)
  const [appointmentNotFound, setAppointmentNotFound] = useState(false)

  const [step, setStep] = useState<Step>('picker')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [orgTimezone, setOrgTimezone] = useState('UTC')
  const [maxHorizonDays, setMaxHorizonDays] = useState(60)

  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)

  const { slots, loading: slotsLoading, error: slotsError } = useAvailableSlots(
    appointment?.serviceId ?? null,
    selectedDate,
  )

  useEffect(() => {
    if (!id) return
    setLoadingAppointment(true)
    getAppointment(id)
      .then((apt) => {
        if (!apt) {
          setAppointmentNotFound(true)
        } else {
          setAppointment(apt)
        }
      })
      .catch(() => {
        setAppointmentError('Ocurrió un error al cargar el turno.')
      })
      .finally(() => {
        setLoadingAppointment(false)
      })
  }, [id])

  useEffect(() => {
    getBusinessSettings()
      .then((settings) => {
        setOrgTimezone(settings.timezone)
        setMaxHorizonDays(settings.bookingMaxHorizonDays)
      })
      .catch(() => {
        // Non-critical: fallback values already set
      })
  }, [])

  if (loadingAppointment) {
    return (
      <div className="flex items-center justify-center min-h-32">
        <p className="text-gray-500">Cargando turno...</p>
      </div>
    )
  }

  if (appointmentNotFound) {
    return (
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
        <p className="text-yellow-800">No encontramos este turno.</p>
      </div>
    )
  }

  if (appointmentError) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-red-700">{appointmentError}</p>
      </div>
    )
  }

  if (!appointment) return null

  const today = new Date().toISOString().slice(0, 10)
  const maxDate = addDays(new Date(), maxHorizonDays)

  async function handleConfirm() {
    if (!selectedSlot || !id) return
    setRescheduleLoading(true)
    setRescheduleError(null)
    try {
      await rescheduleAppointment({ appointmentId: id, newStartsAt: selectedSlot })
      navigate(`/booking/confirmation/${id}`)
    } catch (err: unknown) {
      setRescheduleError((err as Error).message ?? 'Error al reprogramar el turno.')
    } finally {
      setRescheduleLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-heading font-bold text-shell-text mb-2">Reprogramar turno</h2>
      <p className="text-sm text-shell-subtleText mb-6">
        Servicio: <strong>{appointment.serviceName}</strong>
      </p>

      {step === 'picker' && (
        <div>
          <p className="text-shell-subtleText mb-4">
            Elegí una nueva fecha y horario para tu turno.
          </p>

          <div className="mb-4">
            <label htmlFor="reschedule-date" className="block text-sm font-medium text-shell-text mb-1">Fecha</label>
            <input
              id="reschedule-date"
              type="date"
              min={today}
              max={maxDate}
              className="block w-full rounded-lg border border-shell-border px-3 py-2 text-shell-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value)
                  setSelectedSlot(null)
                }
              }}
            />
          </div>

          {selectedDate && (
            <div>
              <p className="text-sm text-shell-subtleText mb-3">
                Horarios disponibles para el{' '}
                <strong>
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </strong>
                :
              </p>

              {slotsLoading && (
                <p className="text-shell-subtleText animate-pulse">Buscando horarios disponibles…</p>
              )}
              {slotsError && (
                <p className="text-red-600">{slotsError}</p>
              )}
              {!slotsLoading && !slotsError && slots.length === 0 && (
                <p className="text-shell-subtleText">
                  No hay horarios disponibles para esta fecha.
                </p>
              )}
              {!slotsLoading && !slotsError && slots.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot === slot.starts_at
                    return (
                      <button
                        key={slot.starts_at}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot.starts_at)
                          setRescheduleError(null)
                          setStep('confirm')
                        }}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-shell-border bg-white text-shell-text hover:bg-emerald-50 hover:border-emerald-400'
                        }`}
                      >
                        {formatSlotTime(slot.starts_at, orgTimezone)}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 'confirm' && selectedSlot && (
        <div>
          <button
            type="button"
            onClick={() => setStep('picker')}
            className="text-sm text-shell-subtleText hover:text-shell-text mb-4 inline-flex items-center gap-1"
          >
            ← Volver
          </button>

          <h3 className="text-lg font-semibold text-shell-text mb-4">Confirmá la reprogramación</h3>

          <div className="rounded-lg border border-shell-border bg-white divide-y divide-shell-border mb-6">
            <div className="px-4 py-3 flex justify-between">
              <span className="text-sm text-shell-subtleText">Servicio</span>
              <span className="text-sm font-medium text-shell-text">{appointment.serviceName}</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span className="text-sm text-shell-subtleText">Nuevo horario</span>
              <span className="text-sm font-medium text-shell-text">
                {formatSlotTime(selectedSlot, orgTimezone)}
              </span>
            </div>
          </div>

          {rescheduleError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{rescheduleError}</p>
              <button
                type="button"
                onClick={() => {
                  setRescheduleError(null)
                  setSelectedSlot(null)
                  setStep('picker')
                }}
                className="mt-2 text-sm font-medium text-red-700 underline hover:no-underline"
              >
                Elegir otro turno
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={rescheduleLoading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {rescheduleLoading ? 'Reprogramando turno...' : 'Confirmar reprogramación'}
          </button>
        </div>
      )}
    </div>
  )
}
