import { FormEvent, useEffect, useMemo, useState } from 'react'
import { cn } from '../lib/cn'
import { describeDiscount, shortDiscount, toStoredValue, type DiscountType } from '../lib/coupons'
import {
  PROMO_STATUS_LABEL,
  promoStatus,
  promoValidityText,
  validatePromoForm,
  type PromoFormErrors,
  type PromoStatus,
} from '../lib/promos'
import {
  adminDeletePromo,
  adminListPromos,
  adminSavePromo,
  adminSetPromoActive,
  type AdminPromo,
} from '../services/promos'
import { listServices, type Service } from '../services/adminServices'
import { ActionButton, ActionRow } from '../components/ActionButton'
import { ConfirmModal } from '../components/ConfirmModal'
import { MultiListbox } from '../components/MultiListbox'

interface FormState {
  id: string | null
  name: string
  description: string
  discountType: DiscountType
  discountValue: string
  startsOn: string
  endsOn: string
  serviceIds: string[]
  isActive: boolean
  showOnSite: boolean
}

const EMPTY_FORM: FormState = {
  id: null,
  name: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  startsOn: '',
  endsOn: '',
  serviceIds: [],
  isActive: true,
  showOnSite: false,
}

const STATUS_CLASS: Record<PromoStatus, string> = {
  running: 'bg-emerald-100 text-emerald-700',
  upcoming: 'bg-[var(--color-lilac)] text-shell-text',
  ended: 'bg-gray-100 text-gray-500',
  inactive: 'bg-gray-100 text-gray-500',
}

function toForm(promo: AdminPromo): FormState {
  return {
    id: promo.id,
    name: promo.name,
    description: promo.description ?? '',
    discountType: promo.discountType,
    discountValue:
      promo.discountType === 'percent' ? String(promo.discountValue) : String(promo.discountValue / 100),
    startsOn: promo.startsOn,
    endsOn: promo.endsOn,
    serviceIds: promo.serviceIds,
    isActive: promo.isActive,
    showOnSite: promo.showOnSite,
  }
}

function todayKey(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const fieldCls =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]'

/** Admin: promos on chosen services, with dates. They apply by themselves when booking. */
export function AdminPromosPage() {
  const [promos, setPromos] = useState<AdminPromo[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [form, setForm] = useState<FormState | null>(null)
  const [errors, setErrors] = useState<PromoFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [confirm, setConfirm] = useState<AdminPromo | null>(null)

  async function load() {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [list, allServices] = await Promise.all([adminListPromos(), listServices().catch(() => [] as Service[])])
      setPromos(list)
      setServices(allServices)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No pudimos cargar las promos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const isFormOpen = form !== null
  const closeForm = () => {
    setForm(null)
    setErrors({})
    setFormError(null)
  }

  useEffect(() => {
    if (!isFormOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving && !confirm) closeForm()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isFormOpen, isSaving, confirm])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current))

  const serviceOptions = useMemo(
    () => [...services].sort((a, b) => a.name.localeCompare(b.name)),
    [services],
  )

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setFormError(null)
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const openEdit = (promo: AdminPromo) => {
    setForm(toForm(promo))
    setErrors({})
    setFormError(null)
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form) return
    const found = validatePromoForm(form)
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) return

    setIsSaving(true)
    try {
      await adminSavePromo({
        id: form.id,
        name: form.name.trim(),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: toStoredValue(form.discountType, form.discountValue),
        startsOn: form.startsOn,
        endsOn: form.endsOn,
        isActive: form.isActive,
        showOnSite: form.showOnSite,
        serviceIds: form.serviceIds,
      })
      setSuccessMessage(form.id ? 'Promo actualizada.' : 'Promo creada.')
      closeForm()
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No pudimos guardar la promo.')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActive = async (promo: AdminPromo) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      await adminSetPromoActive(promo.id, !promo.isActive)
      setPromos((current) => current.map((p) => (p.id === promo.id ? { ...p, isActive: !p.isActive } : p)))
      setSuccessMessage(promo.isActive ? `${promo.name} fue desactivada.` : `${promo.name} fue activada.`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No pudimos cambiar la promo.')
    }
  }

  const confirmDelete = async () => {
    if (!confirm) return
    const promo = confirm
    setConfirm(null)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      await adminDeletePromo(promo.id)
      setPromos((current) => current.filter((p) => p.id !== promo.id))
      setSuccessMessage('Promo eliminada.')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No pudimos eliminar la promo.')
    }
  }

  const today = todayKey()

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-heading text-2xl font-semibold text-shell-text">Promos</h1>
            <button
              type="button"
              onClick={openCreate}
              className="shrink-0 rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
            >
              + Nueva promo
            </button>
          </div>
          <p className="mt-1 text-sm text-shell-subtleText">
            Descuentos en servicios elegidos, por fechas. Se aplican solos al reservar y el servicio se ve en promo.
          </p>
        </div>

        {errorMessage && !isFormOpen && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {isLoading ? (
          <p className="py-8 text-center text-sm text-shell-subtleText">Cargando promos…</p>
        ) : promos.length === 0 ? (
          <div className="shell-surface rounded-2xl border py-12 text-center shadow-sm">
            <p className="font-semibold text-shell-text">Todavía no creaste promos</p>
            <p className="mt-1 text-sm text-shell-subtleText">
              Una promo baja el precio de los servicios que elijas durante unos días. Ej: semana de manos.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {promos.map((promo) => {
              const status = promoStatus(promo, today)
              return (
                <li
                  key={promo.id}
                  className={cn(
                    'rounded-2xl border border-shell-border bg-white p-4 shadow-sm',
                    (status === 'inactive' || status === 'ended') && 'opacity-70',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-base font-bold text-shell-text">{promo.name}</p>
                      <p className="text-sm text-shell-subtleText">
                        {describeDiscount({ type: promo.discountType, value: promo.discountValue })}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--color-peach)] px-2.5 py-1 text-xs font-bold text-[var(--color-peach-ink)]">
                      {shortDiscount({ type: promo.discountType, value: promo.discountValue })}
                    </span>
                  </div>

                  {promo.description && <p className="mt-1 text-sm text-shell-text">{promo.description}</p>}

                  <p className="mt-2 text-xs text-shell-subtleText">
                    {promo.serviceNames.length > 0 ? promo.serviceNames.join(', ') : 'Sin servicios'} ·{' '}
                    {promoValidityText(promo.startsOn, promo.endsOn)} · {promo.timesUsed}{' '}
                    {promo.timesUsed === 1 ? 'uso' : 'usos'}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                    <span className={cn('rounded-full px-2 py-0.5', STATUS_CLASS[status])}>
                      {PROMO_STATUS_LABEL[status]}
                    </span>
                    {promo.showOnSite && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">En el sitio web</span>
                    )}
                  </div>

                  <ActionRow className="mt-3">
                    <ActionButton onClick={() => openEdit(promo)} aria-label={`Editar ${promo.name}`}>
                      Editar
                    </ActionButton>
                    <ActionButton
                      tone="neutral"
                      onClick={() => void toggleActive(promo)}
                      aria-label={`${promo.isActive ? 'Desactivar' : 'Activar'} ${promo.name}`}
                    >
                      {promo.isActive ? 'Desactivar' : 'Activar'}
                    </ActionButton>
                    <ActionButton tone="danger" onClick={() => setConfirm(promo)} aria-label={`Eliminar ${promo.name}`}>
                      Eliminar
                    </ActionButton>
                  </ActionRow>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="promo-form-title"
            noValidate
            onSubmit={(e) => void handleSubmit(e)}
            className="max-h-[88dvh] w-full max-w-lg space-y-2.5 overflow-y-auto rounded-t-2xl bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-xl sm:max-h-[92dvh] sm:space-y-3 sm:rounded-2xl sm:p-4"
          >
            <h2 id="promo-form-title" className="text-base font-semibold text-shell-text">
              {form.id ? 'Editar promo' : 'Nueva promo'}
            </h2>

            <div>
              <label htmlFor="promo-name" className="mb-1 block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                id="promo-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className={fieldCls}
                placeholder="Ej: Semana de manos"
                autoComplete="off"
                autoFocus
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="promo-description" className="mb-1 block text-sm font-medium text-gray-700">
                Descripción <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                id="promo-description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className={fieldCls}
                placeholder="Ej: Esta semana, todo en manos con descuento"
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="promo-value" className="mb-1 block text-sm font-medium text-gray-700">
                  {form.discountType === 'percent' ? 'Porcentaje (%)' : 'Monto a descontar ($)'}
                </label>
                <input
                  id="promo-value"
                  type="number"
                  min="1"
                  step={form.discountType === 'percent' ? '1' : 'any'}
                  value={form.discountValue}
                  onChange={(e) => setField('discountValue', e.target.value)}
                  className={fieldCls}
                  placeholder={form.discountType === 'percent' ? 'Ej: 20' : 'Ej: 1500'}
                />
              </div>
              <div>
                <span className="mb-1 block text-sm font-medium text-gray-700">Tipo</span>
                <div role="radiogroup" aria-label="Tipo de descuento" className="grid grid-cols-2 gap-1">
                  {([
                    { value: 'percent', label: 'Porcentaje' },
                    { value: 'fixed', label: 'Monto fijo' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={form.discountType === opt.value}
                      onClick={() => setField('discountType', opt.value)}
                      className={cn(
                        'h-[38px] rounded-lg border px-1 text-xs font-medium transition-colors',
                        form.discountType === opt.value
                          ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                          : 'border-shell-border bg-white text-shell-text hover:bg-shell-muted',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {errors.discountValue && <p className="col-span-2 text-sm text-red-600">{errors.discountValue}</p>}
            </div>

            <div>
              <label htmlFor="promo-services" className="mb-1 block text-sm font-medium text-gray-700">
                Servicios en promo
              </label>
              <MultiListbox
                id="promo-services"
                ariaLabel="Servicios en promo"
                placeholder="Elegí los servicios"
                values={form.serviceIds}
                onChange={(ids) => setField('serviceIds', ids)}
                options={serviceOptions.map((service) => ({
                  value: service.id,
                  label: service.isActive ? service.name : `${service.name} (inactivo)`,
                }))}
              />
              {errors.services && <p className="mt-1 text-sm text-red-600">{errors.services}</p>}
            </div>

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-gray-700">Vigencia</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="promo-starts" className="mb-1 block text-xs text-gray-500">
                    Desde
                  </label>
                  <input
                    id="promo-starts"
                    type="date"
                    required
                    value={form.startsOn}
                    onChange={(e) => setField('startsOn', e.target.value)}
                    aria-invalid={errors.startsOn ? true : undefined}
                    className="dt-field"
                  />
                  {errors.startsOn && <p className="mt-1 text-sm text-red-600">{errors.startsOn}</p>}
                </div>
                <div>
                  <label htmlFor="promo-ends" className="mb-1 block text-xs text-gray-500">
                    Hasta
                  </label>
                  <input
                    id="promo-ends"
                    type="date"
                    required
                    value={form.endsOn}
                    onChange={(e) => setField('endsOn', e.target.value)}
                    aria-invalid={errors.endsOn ? true : undefined}
                    className="dt-field"
                  />
                  {errors.endsOn && <p className="mt-1 text-sm text-red-600">{errors.endsOn}</p>}
                </div>
                {errors.dates && <p className="col-span-2 text-sm text-red-600">{errors.dates}</p>}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-2 text-sm text-shell-text">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.showOnSite}
                  onChange={(e) => setField('showOnSite', e.target.checked)}
                  className="h-4 w-4"
                />
                Mostrar en la web
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField('isActive', e.target.checked)}
                  className="h-4 w-4"
                />
                Promo activa
              </label>
            </div>

            {formError && (
              <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}

            <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-shell-border bg-white px-4 pt-2.5 sm:static sm:mx-0 sm:border-0 sm:px-0 sm:pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                disabled={isSaving}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        isOpen={confirm !== null}
        title="Eliminar promo"
        message={
          confirm
            ? `¿Eliminás la promo “${confirm.name}”? Los turnos que ya la usaron conservan su descuento.`
            : ''
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => void confirmDelete()}
        onCancel={() => setConfirm(null)}
      />
    </>
  )
}
