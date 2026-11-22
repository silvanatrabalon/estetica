import { BookingStepper } from '../components/booking/BookingStepper'
import { FilterMenu } from '../components/FilterMenu'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../hooks/useUser'
import { useBookingClients } from '../hooks/useBookingClients'
import {
  DEFAULT_TARGET,
  canUseCoupon,
  targetToBookingParams,
  validateBookingTarget,
  type BookingTarget,
} from '../lib/bookingTarget'
import { useActiveServices } from '../hooks/useActiveServices'
import { useAvailableSlots } from '../hooks/useAvailableSlots'
import { formatPriceARS } from '../lib/formatPrice'
import { formatSlotTime, toLocalDateKey } from '../lib/formatSlotTime'
import { deriveGridTimes } from '../lib/businessHours'
import { BookingCalendar, BookingForWhom, BookingSlotDayView } from '../components/booking'
import { getBusinessSettings } from '../services/businessSettings'
import { getLandingConfig } from '../services/landing'
import { createAppointment, isConflictError } from '../services/appointments'
import { validateCoupon } from '../services/coupons'
import { normalizeCouponCode, shortDiscount } from '../lib/coupons'
import type { AvailableSlot } from '../services/availability'
import type { Service } from '../services/adminServices'
import { listCategories } from '../services/adminCategories'
import { listActivePromos, type ActivePromo } from '../services/promos'
import { formatPromoDay } from '../lib/promos'
import type { ServiceCategory } from '../services/adminCategories'

type Step = 1 | 2 | 3 | 4

/** Filter value for "only services in promo" (category ids are UUIDs, so no clash). */
const PROMO_FILTER = 'promo'

function addDays(date: Date, days: number): string {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result.toISOString().slice(0, 10)
}

export function BookingPage() {
  const navigate = useNavigate()
  const { activeRole } = useUser()
  // Admin and staff can book for a client; clients only ever book for themselves
  const canChooseTarget = activeRole === 'admin' || activeRole === 'staff'
  const [target, setTarget] = useState<BookingTarget>(DEFAULT_TARGET)
  const [targetError, setTargetError] = useState<string | null>(null)
  const bookingClients = useBookingClients(canChooseTarget)
  const [step, setStep] = useState<Step>(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [orgTimezone, setOrgTimezone] = useState('UTC')
  const [orgOpenTime, setOrgOpenTime] = useState('08:00')
  const [orgCloseTime, setOrgCloseTime] = useState('20:00')
  const [maxHorizonDays, setMaxHorizonDays] = useState(60)
  const [primaryColor, setPrimaryColor] = useState('#f3e8ff')
  const [panelService, setPanelService] = useState<Service | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discountCents: number
    finalPriceCents: number
  } | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [promos, setPromos] = useState<Record<string, ActivePromo>>({})

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
        setMaxHorizonDays(settings.bookingMaxHorizonDays)
        const { openTime, closeTime } = deriveGridTimes(settings.weeklyHours)
        setOrgOpenTime(openTime)
        setOrgCloseTime(closeTime)
      }),
      getLandingConfig().then((config) => {
        if (config.primaryColor) setPrimaryColor(config.primaryColor)
      }),
      listCategories().then(setCategories).catch(() => {}),
      listActivePromos()
        .then((list) => setPromos(Object.fromEntries(list.map((p) => [p.serviceId, p]))))
        .catch(() => {}),
    ]).catch(() => {
      // Non-critical: fallback values already set
    })
  }, [])

  const hasPromos = services.some((s) => promos[s.id])
  const selectedPromo = selectedService ? promos[selectedService.id] : undefined
  const today = toLocalDateKey(new Date().toISOString(), orgTimezone)
  const maxDate = addDays(new Date(today + 'T12:00:00Z'), maxHorizonDays)

  function handleServiceSelect(service: Service) {
    setSelectedService(service)
    setSelectedDate(null)
    setSelectedSlot(null)
    setPanelService(null)
    clearCoupon()
    setStep(2)
  }

  function handleTargetChange(next: BookingTarget) {
    setTarget(next)
    setTargetError(null)
    // A coupon belongs to the person booking for themselves
    if (!canUseCoupon(next)) clearCoupon()
  }

  function clearCoupon() {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError(null)
  }

  async function handleApplyCoupon() {
    if (!selectedService) return
    const code = normalizeCouponCode(couponInput)
    if (!code) {
      setCouponError('Escribí el código del cupón.')
      return
    }
    setCouponLoading(true)
    setCouponError(null)
    try {
      const check = await validateCoupon(selectedService.id, code)
      setAppliedCoupon({ code, ...check })
    } catch (err) {
      setAppliedCoupon(null)
      setCouponError(err instanceof Error ? err.message : 'No pudimos validar el cupón.')
    } finally {
      setCouponLoading(false)
    }
  }

  function handleCardClick(service: Service) {
    setPanelService(service)
  }

  function handleDateChange(date: string) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setStep(3)
  }


  // Pressing a step already done in the stepper goes back to it, dropping what was chosen after it
  function goToStep(target: 1 | 2 | 3) {
    if (target >= step) return
    setBookingError(null)
    if (target === 1) {
      setSelectedService(null)
      setSelectedDate(null)
      setSelectedSlot(null)
    } else if (target === 2) {
      setSelectedDate(null)
      setSelectedSlot(null)
    }
    setStep(target)
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
    const invalidTarget = canChooseTarget ? validateBookingTarget(target) : null
    if (invalidTarget) {
      setTargetError(invalidTarget)
      return
    }
    setBookingLoading(true)
    setBookingError(null)
    try {
      const appointment = await createAppointment({
        serviceId: selectedService.id,
        startsAt: selectedSlot.starts_at,
        couponCode: appliedCoupon?.code,
        ...(canChooseTarget ? targetToBookingParams(target) : {}),
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
      {/* Step by step menu, always at the top; back arrow from step 2.
          Not sticky: the shell's <main> is the scroll container and never scrolls, so sticky left a gap. */}
      <div className="mb-5 flex items-start gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Volver al paso anterior"
            className="mt-0 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-shell-border bg-white text-shell-subtleText shadow-sm transition-colors hover:border-shell-text hover:text-shell-text"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <BookingStepper step={step} onGoTo={goToStep} />
      </div>

      {/* Fixed CTA — shown from step 3+ */}
      {step >= 3 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-40 md:left-auto md:right-4 md:bottom-4 md:border-0 md:bg-transparent md:p-0">
          <button
            type="button"
            onClick={step === 4 ? handleConfirm : () => { setBookingError(null); setStep(4) }}
            disabled={step === 3 ? selectedSlot === null : bookingLoading}
            className="w-full md:w-auto rounded-lg bg-brand-primary px-6 py-3 font-semibold text-white hover:bg-brand-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {step === 4 ? (bookingLoading ? 'Confirmando…' : 'Confirmar reserva') : 'Siguiente'}
          </button>
        </div>
      )}

      {/* Step 1: Service selector */}
      {step === 1 && (
        <div>
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
              {/* Category filter: one button with a drop-down on phones, chips from sm up */}
              {(categories.length > 0 || hasPromos) && (
                <>
                  <div className="mb-4 sm:hidden">
                    <FilterMenu
                      label="Filtrar por categoría"
                      options={[
                        { value: '', label: 'Todas las categorías' },
                        ...(hasPromos ? [{ value: PROMO_FILTER, label: 'Promos' }] : []),
                        ...categories
                          .filter((cat) => services.some((s) => s.categoryId === cat.id))
                          .map((cat) => ({ value: cat.id, label: cat.name })),
                      ]}
                      value={activeCategoryId ?? ''}
                      onSelect={(value) => setActiveCategoryId(value === '' ? null : value)}
                      active={activeCategoryId !== null}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
                      </svg>
                      {activeCategoryId === null
                        ? 'Todas las categorías'
                        : activeCategoryId === PROMO_FILTER
                          ? 'Promos'
                          : (categories.find((c) => c.id === activeCategoryId)?.name ?? 'Categoría')}
                      <span aria-hidden="true" className="text-xs text-shell-subtleText">▾</span>
                    </FilterMenu>
                  </div>
                  <div className="hidden flex-wrap gap-2 mb-4 sm:flex">
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
                    {hasPromos && (
                      <button
                        type="button"
                        onClick={() => setActiveCategoryId(PROMO_FILTER)}
                        className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
                          activeCategoryId === PROMO_FILTER
                            ? 'bg-[var(--color-peach-ink)] text-white'
                            : 'bg-[var(--color-peach)] text-[var(--color-peach-ink)] hover:brightness-95'
                        }`}
                      >
                        Promos
                      </button>
                    )}
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
                </>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(activeCategoryId === null
                  ? services
                  : activeCategoryId === PROMO_FILTER
                    ? services.filter((s) => promos[s.id])
                    : services.filter((s) => s.categoryId === activeCategoryId)
                ).map((svc) => (
                  <ServiceCard
                    key={svc.id}
                    service={svc}
                    selected={selectedService?.id === svc.id}
                    primaryColor={primaryColor}
                    promo={promos[svc.id]}
                    onClick={() => handleCardClick(svc)}
                  />
                ))}
              </div>
            </>
          )}

          <ServiceDetailPanel
            service={panelService}
            promo={panelService ? promos[panelService.id] : undefined}
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
          <BookingCalendar
            serviceId={selectedService.id}
            minDate={today}
            maxDate={maxDate}
            selectedDate={selectedDate}
            onSelect={handleDateChange}
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

          <div className="rounded-3xl border border-shell-border bg-white divide-y divide-shell-border mb-4 overflow-hidden">
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
            {selectedPromo && (
              <>
                <div className="px-4 py-3 flex justify-between bg-[var(--color-peach)]/40">
                  <span className="text-sm font-medium text-[var(--color-peach-ink)]">Promo {selectedPromo.name}</span>
                  <span className="text-sm font-medium text-[var(--color-peach-ink)]">
                    -${(selectedPromo.discountCents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm font-semibold text-shell-text">Total</span>
                  <span className="text-sm font-bold text-shell-text">
                    ${(selectedPromo.finalPriceCents / 100).toFixed(2)}
                  </span>
                </div>
              </>
            )}
            {appliedCoupon && (
              <>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm text-emerald-700">Cupón {appliedCoupon.code}</span>
                  <span className="text-sm font-medium text-emerald-700">
                    -${(appliedCoupon.discountCents / 100).toFixed(2)}
                  </span>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <span className="text-sm font-semibold text-shell-text">Total</span>
                  <span className="text-sm font-bold text-shell-text">
                    ${(appliedCoupon.finalPriceCents / 100).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          {canChooseTarget && (
            <BookingForWhom
              value={target}
              onChange={handleTargetChange}
              clients={bookingClients.clients}
              loading={bookingClients.loading}
              error={bookingClients.error}
              validationError={targetError}
            />
          )}

          {/* Coupon: only for the person booking for themselves */}
          {selectedPromo && canUseCoupon(target) && (
            <p className="mb-4 rounded-2xl bg-[var(--color-peach)]/40 px-4 py-3 text-sm text-[var(--color-peach-ink)]">
              Este servicio ya tiene una promo y no se suma con cupones.
            </p>
          )}
          {!selectedPromo && canUseCoupon(target) && (
          <div className="mb-4 rounded-3xl border border-shell-border bg-white p-4">
            {appliedCoupon ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-emerald-700">
                  ✓ Cupón <strong>{appliedCoupon.code}</strong> aplicado
                </p>
                <button type="button" onClick={clearCoupon} className="text-sm font-medium text-shell-subtleText underline">
                  Quitar
                </button>
              </div>
            ) : (
              <>
                <label htmlFor="coupon-input" className="mb-1.5 block text-sm font-medium text-shell-text">
                  ¿Tenés un cupón?
                </label>
                <div className="flex gap-2">
                  <input
                    id="coupon-input"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void handleApplyCoupon()
                      }
                    }}
                    placeholder="Ej: VERANO10"
                    autoComplete="off"
                    className="min-w-0 flex-1 rounded-lg border border-shell-border px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleApplyCoupon()}
                    disabled={couponLoading}
                    className="rounded-lg border border-shell-border bg-white px-4 py-2 text-sm font-semibold text-shell-text hover:bg-shell-muted disabled:opacity-50"
                  >
                    {couponLoading ? 'Validando…' : 'Aplicar'}
                  </button>
                </div>
                {couponError && (
                  <p role="alert" className="mt-2 text-sm text-red-600">
                    {couponError}
                  </p>
                )}
              </>
            )}
          </div>
          )}

          <p className="mb-6 rounded-2xl bg-[var(--color-lilac)] px-4 py-3 text-sm text-shell-text">
            {target.kind === 'me'
              ? 'Al confirmar, te enviamos un email con los datos de tu reserva.'
              : 'Al confirmar, avisamos por email a la persona (si tiene email) y al profesional.'}
          </p>

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
  promo?: ActivePromo
  onClick: () => void
}

function ServiceCard({ service, selected, primaryColor, promo, onClick }: ServiceCardProps) {
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
      className={`relative w-full text-left rounded-xl border transition-all duration-150 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] ${
        selected
          ? 'border-brand-primary shadow-md ring-1 ring-brand-primary'
          : promo
            ? 'border-[var(--color-peach-ink)]/40 bg-white hover:shadow-md hover:border-[var(--color-peach-ink)]'
            : 'border-shell-border bg-white hover:shadow-md hover:border-brand-primary/40'
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

      {promo && (
        <span className="absolute left-2 top-2 rounded-full bg-[var(--color-peach)] px-2.5 py-1 text-xs font-bold text-[var(--color-peach-ink)] shadow-sm">
          PROMO {shortDiscount({ type: promo.discountType, value: promo.discountValue })}
        </span>
      )}

      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center">
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
        {promo ? (
          <p className="text-xs mt-0.5">
            <s className="text-shell-subtleText">{formatPriceARS(service.priceCents)}</s>{' '}
            <strong className="text-sm text-[var(--color-peach-ink)]">{formatPriceARS(promo.finalPriceCents)}</strong>
            <span className="text-shell-subtleText"> · {service.durationMinutes} min</span>
          </p>
        ) : (
          <p className="text-xs text-shell-subtleText mt-0.5">
            {formatPriceARS(service.priceCents)} · {service.durationMinutes} min
          </p>
        )}
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
  promo?: ActivePromo
  isOpen: boolean
  onClose: () => void
  onSelect: (service: Service) => void
}

function ServiceDetailPanel({
  service,
  promo,
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
          {promo ? (
            <>
              <p className="mt-1 text-shell-subtleText">
                <s>{formatPriceARS(service.priceCents)}</s>{' '}
                <strong className="text-lg text-[var(--color-peach-ink)]">{formatPriceARS(promo.finalPriceCents)}</strong>
                {' '}· {service.durationMinutes} min
              </p>
              <div className="mt-3 rounded-xl bg-[var(--color-peach)]/50 px-3 py-2 text-sm text-[var(--color-peach-ink)]">
                <p className="font-bold">
                  Promo {promo.name} · {shortDiscount({ type: promo.discountType, value: promo.discountValue })}
                </p>
                {promo.description && <p>{promo.description}</p>}
                <p className="text-xs">Válida hasta el {formatPromoDay(promo.endsOn)}</p>
              </div>
            </>
          ) : (
            <p className="text-shell-subtleText mt-1">
              {formatPriceARS(service.priceCents)} · {service.durationMinutes} min
            </p>
          )}
          {service.description && (
            <p className="mt-4 text-sm text-shell-text leading-relaxed">{service.description}</p>
          )}

          <button
            type="button"
            onClick={() => onSelect(service)}
            className="mt-6 w-full rounded-lg bg-brand-primary px-4 py-3 font-semibold text-white hover:bg-brand-strong transition-colors"
          >
            Seleccionar este servicio
          </button>
        </div>
      </div>
    </>
  )
}
