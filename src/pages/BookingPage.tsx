import { resolveBookingTexts } from '../lib/brand'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveServices } from '../hooks/useActiveServices'
import { useAvailableSlots } from '../hooks/useAvailableSlots'
import { formatPriceARS } from '../lib/formatPrice'
import { formatSlotTime } from '../lib/formatSlotTime'
import { deriveGridTimes } from '../lib/businessHours'
import { BookingSlotDayView } from '../components/booking'
import { getBusinessSettings } from '../services/businessSettings'
import { getLandingConfig } from '../services/landing'
import { createAppointment, isConflictError } from '../services/appointments'
import type { AvailableSlot } from '../services/availability'
import type { Service } from '../services/adminServices'
import { listCategories } from '../services/adminCategories'
import type { ServiceCategory } from '../services/adminCategories'

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
  const [bookingTexts, setBookingTexts] = useState(() => resolveBookingTexts({}))
  const [orgOpenTime, setOrgOpenTime] = useState('08:00')
  const [orgCloseTime, setOrgCloseTime] = useState('20:00')
  const [maxHorizonDays, setMaxHorizonDays] = useState(60)
  const [primaryColor, setPrimaryColor] = useState('#f3e8ff')
  const [panelService, setPanelService] = useState<Service | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  const { services, loading: servicesLoading, error: servicesError } = useActiveServices()
  const {
    slots,
    loading: slotsLoading,
    error: slotsError,
  } = useAvailableSlots(selectedService?.id ?? null, selectedDate)

  useEffect(() => {
    void Promise.all([
      getBusinessSettings().then((settings) => {
        setOrgTimezone(settings.timezone)
        setBookingTexts(
          resolveBookingTexts({
            bookingHeaderText: settings.bookingHeaderText,
            bookingSubtitleText: settings.bookingSubtitleText,
          }),
        )
        setMaxHorizonDays(settings.bookingMaxHorizonDays)
        const { openTime, closeTime } = deriveGridTimes(settings.weeklyHours)
        setOrgOpenTime(openTime)
        setOrgCloseTime(closeTime)
      }),
      getLandingConfig().then((config) => {
        if (config.primaryColor) setPrimaryColor(config.primaryColor)
      }),
      listCategories().then(setCategories).catch(() => {}),
    ]).catch(() => {
      // Non-critical: fallback values already set
    })
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const maxDate = addDays(new Date(), maxHorizonDays)

  function handleServiceSelect(service: Service) {
    setSelectedService(service)
    setSelectedDate(null)
    setSelectedSlot(null)
    setPanelService(null)
    setStep(2)
  }

  function handleCardClick(service: Service) {
    setPanelService(service)
  }

  function handleDateChange(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setStep(3)
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
    <div className="max-w-lg mx-auto pb-24">
      {/* Sticky step bar — shown from step 2+, sits just below the shell navbar */}
      {step > 1 && (
        <div className="sticky top-16 z-20 -mx-4 md:-mx-6 mb-5 flex items-center gap-3 border-b border-shell-border bg-shell-surface/95 px-4 py-2.5 backdrop-blur-sm md:px-6">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Volver al paso anterior"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-shell-border bg-white text-shell-subtleText shadow-sm transition-colors hover:border-shell-text hover:text-shell-text"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] leading-none text-shell-subtleText mb-0.5">Reservar turno</p>
            <p className="text-sm font-semibold text-shell-text truncate">
              {step === 2 ? 'Elegí una fecha' : step === 3 ? 'Elegí un horario' : 'Confirmá tu reserva'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {[2, 3, 4].map((s) => (
              <span
                key={s}
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  s < step ? 'w-3 bg-emerald-500' : s === step ? 'w-4 bg-emerald-500' : 'w-1.5 bg-shell-border'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Fixed CTA — shown from step 3+ */}
      {step >= 3 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-40 md:left-auto md:right-4 md:bottom-4 md:border-0 md:bg-transparent md:p-0">
          <button
            type="button"
            onClick={step === 4 ? handleConfirm : () => { setBookingError(null); setStep(4) }}
            disabled={step === 3 ? selectedSlot === null : bookingLoading}
            className="w-full md:w-auto rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {step === 4 ? (bookingLoading ? 'Confirmando…' : 'Confirmar reserva') : 'Siguiente'}
          </button>
        </div>
      )}

      {step === 1 && (
        <h2 className="text-2xl font-heading font-bold text-shell-text mb-6">{bookingTexts.header}</h2>
      )}

      {/* Step indicator — only on step 1 */}
      {step === 1 && (
        <div className="flex items-center gap-2 mb-6 text-sm text-shell-subtleText">
          <span className="font-semibold text-shell-text">Servicio</span>
          <span>›</span>
          <span>Fecha</span>
          <span>›</span>
          <span>Horario</span>
          <span>›</span>
          <span>Confirmar</span>
        </div>
      )}

      {/* Step 1: Service selector */}
      {step === 1 && (
        <div>
          <p className="text-shell-subtleText mb-4">{bookingTexts.subtitle}</p>
          {servicesLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-shell-border bg-white animate-pulse"
                >
                  <div className="h-32 rounded-t-xl bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {servicesError && (
            <p className="text-red-600">{servicesError}</p>
          )}
          {!servicesLoading && !servicesError && services.length === 0 && (
            <p className="text-shell-subtleText">No hay servicios disponibles.</p>
          )}
          {!servicesLoading && !servicesError && services.length > 0 && (
            <>
              {/* Category filter chips */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryId(null)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      activeCategoryId === null
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  {categories
                    .filter((cat) => services.some((s) => s.categoryId === cat.id))
                    .map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          activeCategoryId === cat.id
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(activeCategoryId === null
                  ? services
                  : services.filter((s) => s.categoryId === activeCategoryId)
                ).map((svc) => (
                  <ServiceCard
                    key={svc.id}
                    service={svc}
                    selected={selectedService?.id === svc.id}
                    primaryColor={primaryColor}
                    onClick={() => handleCardClick(svc)}
                  />
                ))}
              </div>
            </>
          )}

          <ServiceDetailPanel
            service={panelService}
            isOpen={panelService !== null}
            onClose={() => setPanelService(null)}
            onSelect={handleServiceSelect}
          />
        </div>
      )}

      {/* Step 2: Date picker */}
      {step === 2 && selectedService && (
        <div>
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

      {/* Step 3: Time-axis slot picker */}
      {step === 3 && selectedService && selectedDate && (
        <div>
          <p className="text-shell-subtleText mb-4">
            Turnos disponibles para{' '}
            <strong>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                timeZone: orgTimezone,
              })}
            </strong>
          </p>

          {slotsError && (
            <p className="text-red-600 mb-3">{slotsError}</p>
          )}
          {!slotsError && (
            <BookingSlotDayView
              slots={slots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              orgTimezone={orgTimezone}
              openTime={orgOpenTime}
              closeTime={orgCloseTime}
              loading={slotsLoading}
            />
          )}
        </div>
      )}

      {/* Step 4: Review and confirm */}
      {step === 4 && selectedService && selectedSlot && (
        <div>
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
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ServiceCard
// ─────────────────────────────────────────────────────────────────────────────

interface ServiceCardProps {
  service: Service
  selected: boolean
  primaryColor: string
  onClick: () => void
}

function ServiceCard({ service, selected, primaryColor, onClick }: ServiceCardProps) {
  const [imgError, setImgError] = useState(false)
  const truncatedDesc = service.description
    ? service.description.length > 80
      ? service.description.slice(0, 80) + '…'
      : service.description
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left rounded-xl border transition-all duration-150 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        selected
          ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500'
          : 'border-shell-border bg-white hover:shadow-md hover:border-emerald-300'
      }`}
    >
      {/* Image area */}
      <div
        className="h-32 w-full flex items-center justify-center"
        style={
          !service.imageUrl || imgError
            ? { backgroundColor: primaryColor }
            : {}
        }
      >
        {service.imageUrl && !imgError ? (
          <img
            src={service.imageUrl}
            alt={service.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 text-white/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
        )}
      </div>

      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      )}

      {/* Card body */}
      <div className="p-3">
        <p className="font-semibold text-shell-text text-sm leading-tight">{service.name}</p>
        <p className="text-xs text-shell-subtleText mt-0.5">
          {formatPriceARS(service.priceCents)} · {service.durationMinutes} min
        </p>
        {truncatedDesc && (
          <p className="text-xs text-shell-subtleText mt-1 line-clamp-2">{truncatedDesc}</p>
        )}
      </div>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ServiceDetailPanel
// ─────────────────────────────────────────────────────────────────────────────

interface ServiceDetailPanelProps {
  service: Service | null
  isOpen: boolean
  onClose: () => void
  onSelect: (service: Service) => void
}

function ServiceDetailPanel({
  service,
  isOpen,
  onClose,
  onSelect,
}: ServiceDetailPanelProps) {
  const [imgError, setImgError] = useState(false)

  // Reset image error when service changes
  useEffect(() => {
    setImgError(false)
  }, [service?.id])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen || !service) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel — bottom drawer on mobile, side panel on md+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={service.name}
        className="fixed z-50 bg-white shadow-xl
          bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh] overflow-y-auto
          md:bottom-auto md:top-0 md:right-0 md:left-auto md:h-screen md:max-h-screen md:w-96 md:rounded-none"
      >
        {/* Close button */}
        <div className="flex justify-end p-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-shell-subtleText hover:text-shell-text"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div
          className={`w-full h-48 flex items-center justify-center${!service.imageUrl || imgError ? ' bg-pink-50' : ''}`}
        >
          {service.imageUrl && !imgError ? (
            <img
              src={service.imageUrl}
              alt={service.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16 text-pink-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-shell-text">{service.name}</h3>
          <p className="text-shell-subtleText mt-1">
            {formatPriceARS(service.priceCents)} · {service.durationMinutes} min
          </p>
          {service.description && (
            <p className="mt-4 text-sm text-shell-text leading-relaxed">{service.description}</p>
          )}

          <button
            type="button"
            onClick={() => onSelect(service)}
            className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Seleccionar este servicio
          </button>
        </div>
      </div>
    </>
  )
}
