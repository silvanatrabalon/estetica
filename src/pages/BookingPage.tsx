import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveServices } from '../hooks/useActiveServices'
import { useAvailableSlots } from '../hooks/useAvailableSlots'
import { formatSlotTime } from '../lib/formatSlotTime'
import { getBusinessSettings } from '../services/businessSettings'
import { createAppointment, isConflictError } from '../services/appointments'
import type { AvailableSlot } from '../services/availability'
import type { Service } from '../services/adminServices'

type Step = 1 | 2 | 3 | 4

function addDays(date: Date, days: number): string {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result.toISOString().slice(0, 10)
}

export function BookingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [orgTimezone, setOrgTimezone] = useState('UTC')
  const [maxHorizonDays, setMaxHorizonDays] = useState(60)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

  const { services, loading: servicesLoading, error: servicesError } = useActiveServices()
  const {
    slots,
    loading: slotsLoading,
    error: slotsError,
  } = useAvailableSlots(selectedService?.id ?? null, selectedDate)

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

  const today = new Date().toISOString().slice(0, 10)
  const maxDate = addDays(new Date(), maxHorizonDays)

  function handleServiceSelect(service: Service) {
    setSelectedService(service)
    setSelectedDate(null)
    setSelectedSlot(null)
    setStep(2)
  }

  function handleDateChange(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setStep(3)
  }

  function handleSlotSelect(slot: AvailableSlot) {
    setSelectedSlot(slot)
    setBookingError(null)
    setStep(4)
  }

  function handleBack() {
    if (step === 2) {
      setSelectedService(null)
      setSelectedDate(null)
      setSelectedSlot(null)
      setStep(1)
    } else if (step === 3) {
      setSelectedDate(null)
      setSelectedSlot(null)
      setStep(2)
    } else if (step === 4) {
      setBookingError(null)
      setStep(3)
    }
  }

  async function handleConfirm() {
    if (!selectedService || !selectedSlot) return
    setBookingLoading(true)
    setBookingError(null)
    try {
      const appointment = await createAppointment({
        serviceId: selectedService.id,
        startsAt: selectedSlot.starts_at,
      })
      navigate(`/booking/confirmation/${appointment.id}`)
    } catch (err: unknown) {
      if (isConflictError(err)) {
        setBookingError((err as Error).message)
      } else {
        setBookingError((err as Error).message ?? 'Error al confirmar el turno.')
      }
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-heading font-bold text-shell-text mb-6">Reservar turno</h2>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 text-sm text-shell-subtleText">
        <span className={step === 1 ? 'font-semibold text-shell-text' : ''}>Servicio</span>
        <span>›</span>
        <span className={step === 2 ? 'font-semibold text-shell-text' : ''}>Fecha</span>
        <span>›</span>
        <span className={step === 3 ? 'font-semibold text-shell-text' : ''}>Horario</span>
        <span>›</span>
        <span className={step === 4 ? 'font-semibold text-shell-text' : ''}>Confirmar</span>
      </div>

      {/* Step 1: Service selector */}
      {step === 1 && (
        <div>
          <p className="text-shell-subtleText mb-4">Elegí el servicio que querés reservar.</p>
          {servicesLoading && (
            <p className="text-shell-subtleText animate-pulse">Cargando servicios…</p>
          )}
          {servicesError && (
            <p className="text-red-600">{servicesError}</p>
          )}
          {!servicesLoading && !servicesError && services.length === 0 && (
            <p className="text-shell-subtleText">No hay servicios disponibles.</p>
          )}
          {!servicesLoading && !servicesError && services.length > 0 && (
            <ul className="space-y-2">
              {services.map((svc) => (
                <li key={svc.id}>
                  <button
                    type="button"
                    onClick={() => handleServiceSelect(svc)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-shell-border bg-white hover:bg-emerald-50 hover:border-emerald-400 transition-colors"
                  >
                    <span className="font-medium text-shell-text">{svc.name}</span>
                    <span className="ml-2 text-sm text-shell-subtleText">
                      {svc.durationMinutes} min
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Step 2: Date picker */}
      {step === 2 && selectedService && (
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-shell-subtleText hover:text-shell-text mb-4 inline-flex items-center gap-1"
          >
            ← Volver
          </button>
          <p className="text-shell-subtleText mb-4">
            Seleccioná una fecha para <strong>{selectedService.name}</strong>.
          </p>
          <input
            type="date"
            min={today}
            max={maxDate}
            className="block w-full rounded-lg border border-shell-border px-3 py-2 text-shell-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onChange={(e) => {
              if (e.target.value) handleDateChange(e.target.value)
            }}
          />
        </div>
      )}

      {/* Step 3: Slot grid */}
      {step === 3 && selectedService && selectedDate && (
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-shell-subtleText hover:text-shell-text mb-4 inline-flex items-center gap-1"
          >
            ← Volver
          </button>
          <p className="text-shell-subtleText mb-4">
            Elegí un horario disponible para el{' '}
            <strong>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </strong>
            .
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
                const isSelected = selectedSlot?.starts_at === slot.starts_at
                return (
                  <button
                    key={slot.starts_at}
                    type="button"
                    onClick={() => handleSlotSelect(slot)}
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

      {/* Step 4: Review and confirm */}
      {step === 4 && selectedService && selectedSlot && (
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-shell-subtleText hover:text-shell-text mb-4 inline-flex items-center gap-1"
          >
            ← Volver
          </button>
          <h3 className="text-lg font-semibold text-shell-text mb-4">Revisá tu reserva</h3>

          <div className="rounded-lg border border-shell-border bg-white divide-y divide-shell-border mb-6">
            <div className="px-4 py-3 flex justify-between">
              <span className="text-sm text-shell-subtleText">Servicio</span>
              <span className="text-sm font-medium text-shell-text">{selectedService.name}</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span className="text-sm text-shell-subtleText">Fecha y hora</span>
              <span className="text-sm font-medium text-shell-text">
                {formatSlotTime(selectedSlot.starts_at, orgTimezone)}
              </span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span className="text-sm text-shell-subtleText">Duración</span>
              <span className="text-sm font-medium text-shell-text">
                {selectedService.durationMinutes} min
              </span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span className="text-sm text-shell-subtleText">Precio</span>
              <span className="text-sm font-medium text-shell-text">
                ${(selectedService.priceCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {bookingError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{bookingError}</p>
              <button
                type="button"
                onClick={() => {
                  setBookingError(null)
                  setSelectedSlot(null)
                  setStep(3)
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
            disabled={bookingLoading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {bookingLoading ? 'Confirmando…' : 'Confirmar reserva'}
          </button>
        </div>
      )}
    </div>
  )
}
