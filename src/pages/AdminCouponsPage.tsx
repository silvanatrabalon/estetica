import { FormEvent, useEffect, useState } from 'react'
import { ActionButton, ActionRow } from '../components/ActionButton'
import { cn } from '../lib/cn'
import {
  describeDiscount,
  normalizeCouponCode,
  shortDiscount,
  toStoredValue,
  validateCouponCode,
  validateDiscountValue,
  type DiscountType,
} from '../lib/coupons'
import {
  adminDeleteCoupon,
  adminListCoupons,
  adminSaveCoupon,
  adminSetCouponActive,
  type AdminCoupon,
} from '../services/adminCoupons'
import { adminListCategories, type ServiceCategory } from '../services/adminCategories'
import { ConfirmModal } from '../components/ConfirmModal'
import { Listbox } from '../components/Listbox'
import { copyToClipboard } from '../lib/clipboard'
import { CouponImageModal } from '../components/admin/CouponImageModal'
import { getBusinessSettings } from '../services/businessSettings'

interface FormState {
  id: string | null
  code: string
  description: string
  discountType: DiscountType
  discountValue: string
  categoryId: string
  startsOn: string
  endsOn: string
  isActive: boolean
  showOnSite: boolean
}

const EMPTY_FORM: FormState = {
  id: null,
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  categoryId: '',
  startsOn: '',
  endsOn: '',
  isActive: true,
  showOnSite: false,
}

interface FormErrors {
  code?: string
  discountValue?: string
  startsOn?: string
  endsOn?: string
  dates?: string
}

function toForm(coupon: AdminCoupon): FormState {
  return {
    id: coupon.id,
    code: coupon.code,
    description: coupon.description ?? '',
    discountType: coupon.discountType,
    discountValue:
      coupon.discountType === 'percent' ? String(coupon.discountValue) : String(coupon.discountValue / 100),
    categoryId: coupon.categoryId ?? '',
    startsOn: coupon.startsOn ?? '',
    endsOn: coupon.endsOn ?? '',
    isActive: coupon.isActive,
    showOnSite: coupon.showOnSite,
  }
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}
  const codeError = validateCouponCode(form.code)
  if (codeError) errors.code = codeError
  const valueError = validateDiscountValue(form.discountType, form.discountValue)
  if (valueError) errors.discountValue = valueError
  if (!form.startsOn) errors.startsOn = 'Elegí desde cuándo vale el cupón.'
  if (!form.endsOn) errors.endsOn = 'Elegí hasta cuándo vale el cupón.'
  if (form.startsOn && form.endsOn && form.startsOn > form.endsOn) {
    errors.dates = 'La fecha de fin no puede ser anterior a la de inicio.'
  }
  return errors
}

function formatDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function validityText(coupon: AdminCoupon): string {
  if (coupon.startsOn && coupon.endsOn) return `Del ${formatDay(coupon.startsOn)} al ${formatDay(coupon.endsOn)}`
  if (coupon.startsOn) return `Desde el ${formatDay(coupon.startsOn)}`
  if (coupon.endsOn) return `Hasta el ${formatDay(coupon.endsOn)}`
  return 'Sin fecha de vencimiento'
}

const fieldCls =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [form, setForm] = useState<FormState | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  const [confirm, setConfirm] = useState<{ coupon: AdminCoupon } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [imageCoupon, setImageCoupon] = useState<AdminCoupon | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    getBusinessSettings()
      .then((settings) => {
        setBusinessName(settings.name)
        setLogoUrl(settings.logoUrl)
      })
      .catch(() => {
        // The image just goes without the business name
      })
  }, [])

  async function copyCode(coupon: AdminCoupon) {
    const ok = await copyToClipboard(coupon.code)
    if (!ok) {
      setErrorMessage(`No pudimos copiar el código. Copialo a mano: ${coupon.code}`)
      return
    }
    setErrorMessage(null)
    setCopiedId(coupon.id)
    window.setTimeout(() => setCopiedId((current) => (current === coupon.id ? null : current)), 2000)
  }

  const load = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [list, cats] = await Promise.all([adminListCoupons(), adminListCategories().catch(() => [])])
      setCoupons(list)
      setCategories(cats)
    } catch {
      setErrorMessage('No pudimos cargar los cupones en este momento.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current))

  const closeForm = () => {
    setForm(null)
    setErrors({})
    setFormError(null)
  }

  const isFormOpen = form !== null
  useEffect(() => {
    if (!isFormOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeForm()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isFormOpen])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setFormError(null)
    setErrors({})
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const openEdit = (coupon: AdminCoupon) => {
    setForm(toForm(coupon))
    setFormError(null)
    setErrors({})
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form) return
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setIsSaving(true)
    setFormError(null)
    try {
      await adminSaveCoupon({
        id: form.id,
        code: normalizeCouponCode(form.code),
        description: form.description.trim(),
        discountType: form.discountType,
        discountValue: toStoredValue(form.discountType, form.discountValue),
        categoryId: form.categoryId || null,
        startsOn: form.startsOn || null,
        endsOn: form.endsOn || null,
        isActive: form.isActive,
        showOnSite: form.showOnSite,
      })
      setSuccessMessage(form.id ? 'Cupón actualizado.' : 'Cupón creado.')
      closeForm()
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No pudimos guardar el cupón.')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActive = async (coupon: AdminCoupon) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      await adminSetCouponActive(coupon.id, !coupon.isActive)
      setCoupons((current) => current.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c)))
      setSuccessMessage(coupon.isActive ? `${coupon.code} fue desactivado.` : `${coupon.code} fue activado.`)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No pudimos cambiar el cupón.')
    }
  }

  const confirmDelete = async () => {
    if (!confirm) return
    const { coupon } = confirm
    setConfirm(null)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const result = await adminDeleteCoupon(coupon.id)
      setSuccessMessage(
        result === 'deleted'
          ? `${coupon.code} fue eliminado.`
          : `${coupon.code} ya se usó, así que se desactivó para conservar el historial.`,
      )
      await load()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No pudimos eliminar el cupón.')
    }
  }

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-heading text-2xl font-semibold text-shell-text">Cupones</h1>
            <button
              type="button"
              onClick={openCreate}
              className="shrink-0 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              + Nuevo cupón
            </button>
          </div>
          <p className="mt-1 text-sm text-shell-subtleText">
            Descuentos que tus clientes cargan al reservar. Cada cliente puede usar un cupón una vez.
          </p>
        </div>

        {errorMessage && (
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
          <p className="py-8 text-center text-sm text-shell-subtleText">Cargando cupones...</p>
        ) : coupons.length === 0 && form === null ? (
          <div className="rounded-2xl border border-shell-border bg-white py-12 text-center shadow-sm">
            <p className="font-semibold text-shell-text">Todavía no creaste cupones</p>
            <p className="mt-1 text-sm text-shell-subtleText">
              Un cupón da un descuento fijo o un porcentaje al reservar.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {coupons.map((coupon) => (
              <li
                key={coupon.id}
                className={cn(
                  'rounded-2xl border border-shell-border bg-white p-4 shadow-sm',
                  !coupon.isActive && 'opacity-60',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-mono text-base font-bold text-shell-text">{coupon.code}</p>
                      <button
                        type="button"
                        onClick={() => void copyCode(coupon)}
                        aria-label={copiedId === coupon.id ? `Código ${coupon.code} copiado` : `Copiar código ${coupon.code}`}
                        title={copiedId === coupon.id ? '¡Copiado!' : 'Copiar código'}
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                          copiedId === coupon.id
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'text-shell-subtleText hover:bg-shell-muted hover:text-shell-text',
                        )}
                      >
                        {copiedId === coupon.id ? (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <rect x="9" y="9" width="11" height="11" rx="2" />
                            <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageCoupon(coupon)}
                        aria-label={`Descargar imagen del cupón ${coupon.code}`}
                        title="Descargar como imagen"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-shell-subtleText transition-colors hover:bg-shell-muted hover:text-shell-text focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="9" cy="9" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-shell-subtleText">
                      {describeDiscount({ type: coupon.discountType, value: coupon.discountValue })}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--color-lilac)] px-2.5 py-1 text-xs font-bold text-shell-text">
                    {shortDiscount({ type: coupon.discountType, value: coupon.discountValue })}
                  </span>
                </div>

                {coupon.description && <p className="mt-1 text-sm text-shell-text">{coupon.description}</p>}

                <p className="mt-2 text-xs text-shell-subtleText">
                  {coupon.categoryName ? `Categoría ${coupon.categoryName}` : 'Todos los servicios'} ·{' '}
                  {validityText(coupon)} · {coupon.timesUsed} {coupon.timesUsed === 1 ? 'uso' : 'usos'}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5',
                      coupon.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500',
                    )}
                  >
                    {coupon.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5',
                      coupon.showOnSite
                        ? 'bg-[var(--color-peach)] text-[var(--color-peach-ink)]'
                        : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    {coupon.showOnSite ? 'Público · en el sitio web' : 'Privado · solo con el código'}
                  </span>
                </div>

                <ActionRow className="mt-3">
                  <ActionButton onClick={() => openEdit(coupon)}>Editar</ActionButton>
                  <ActionButton tone="neutral" onClick={() => void toggleActive(coupon)}>
                    {coupon.isActive ? 'Desactivar' : 'Activar'}
                  </ActionButton>
                  <ActionButton tone="danger" onClick={() => setConfirm({ coupon })}>
                    Eliminar
                  </ActionButton>
                </ActionRow>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CouponImageModal
        isOpen={imageCoupon !== null}
        logoUrl={logoUrl}
        coupon={
          imageCoupon
            ? {
                code: imageCoupon.code,
                discountType: imageCoupon.discountType,
                discountValue: imageCoupon.discountValue,
                scope: imageCoupon.categoryName ? `Categoría ${imageCoupon.categoryName}` : 'Todos los servicios',
                validity: validityText(imageCoupon).replace(/^Del /, 'Válido del ').replace(/^Desde /, 'Válido desde ').replace(/^Hasta /, 'Válido hasta '),
                businessName,
              }
            : null
        }
        onClose={() => setImageCoupon(null)}
      />

      {form !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-form-title"
            onSubmit={(e) => void handleSubmit(e)}
            noValidate
            className="max-h-[88dvh] w-full max-w-lg space-y-2.5 overflow-y-auto rounded-t-2xl bg-white px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-xl sm:max-h-[92dvh] sm:space-y-3 sm:rounded-2xl sm:p-4"
          >
            <h2 id="coupon-form-title" className="text-base font-semibold text-shell-text">{form.id ? 'Editar cupón' : 'Nuevo cupón'}</h2>

            <div>
              <label htmlFor="coupon-code" className="mb-1 block text-sm font-medium text-gray-700">
                Código
              </label>
              <input
                id="coupon-code"
                value={form.code}
                onChange={(e) => setField('code', e.target.value.toUpperCase())}
                className={cn(fieldCls, 'font-mono uppercase')}
                placeholder="Ej: VERANO10"
                autoComplete="off"
              />
              {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="coupon-value" className="mb-1 block text-sm font-medium text-gray-700">
                  {form.discountType === 'percent' ? 'Porcentaje (%)' : 'Monto a descontar ($)'}
                </label>
                <input
                  id="coupon-value"
                  type="number"
                  min="1"
                  step={form.discountType === 'percent' ? '1' : 'any'}
                  value={form.discountValue}
                  onChange={(e) => setField('discountValue', e.target.value)}
                  className={fieldCls}
                  placeholder={form.discountType === 'percent' ? 'Ej: 10' : 'Ej: 500'}
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
              <label htmlFor="coupon-description" className="mb-1 block text-sm font-medium text-gray-700">
                Descripción <span className="font-normal text-gray-400">(opcional, se muestra en el sitio)</span>
              </label>
              <input
                id="coupon-description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className={fieldCls}
                placeholder="Ej: Descuento de verano en uñas"
              />
            </div>

            <div>
              <label htmlFor="coupon-category" className="mb-1 block text-sm font-medium text-gray-700">
                Aplica a
              </label>
              <Listbox
                id="coupon-category"
                value={form.categoryId}
                onChange={(value) => setField('categoryId', value)}
                options={[
                  { value: '', label: 'Todos los servicios' },
                  ...categories.map((c) => ({ value: c.id, label: `Categoría: ${c.name}` })),
                ]}
              />
            </div>

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-gray-700">Vigencia</legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="coupon-starts" className="mb-1 block text-xs text-gray-500">
                    Desde
                  </label>
                  <input
                    id="coupon-starts"
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
                  <label htmlFor="coupon-ends" className="mb-1 block text-xs text-gray-500">
                    Hasta
                  </label>
                  <input
                    id="coupon-ends"
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

            <fieldset>
              <legend className="mb-1 text-sm font-medium text-shell-text">¿Quién puede ver este cupón?</legend>
              <div role="radiogroup" aria-label="¿Quién puede ver este cupón?" className="grid grid-cols-2 gap-2">
                {[
                  { value: true, title: 'Público' },
                  { value: false, title: 'Privado' },
                ].map((opt) => (
                  <button
                    key={opt.title}
                    type="button"
                    role="radio"
                    aria-checked={form.showOnSite === opt.value}
                    onClick={() => setField('showOnSite', opt.value)}
                    className={cn(
                      'h-[38px] rounded-lg border px-2 text-sm font-medium transition-colors',
                      form.showOnSite === opt.value
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                        : 'border-shell-border bg-white text-shell-text hover:bg-shell-muted',
                    )}
                  >
                    {opt.title}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-shell-subtleText">
                {form.showOnSite
                  ? 'Aparece en el sitio web, lo ve cualquiera.'
                  : 'No se muestra en ningún lado: solo lo usa quien reciba el código de tu parte.'}
              </p>
            </fieldset>
            <label className="flex items-center gap-2 text-sm text-shell-text">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField('isActive', e.target.checked)}
                className="h-4 w-4"
              />
              Cupón activo
            </label>

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
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        isOpen={confirm !== null}
        title="Eliminar cupón"
        message={
          confirm
            ? confirm.coupon.timesUsed > 0
              ? `El cupón ${confirm.coupon.code} ya se usó ${confirm.coupon.timesUsed} ${confirm.coupon.timesUsed === 1 ? 'vez' : 'veces'}: se va a desactivar para conservar el historial.`
              : `¿Eliminás el cupón ${confirm.coupon.code}? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel={confirm && confirm.coupon.timesUsed > 0 ? 'Desactivar' : 'Eliminar'}
        destructive
        onConfirm={() => void confirmDelete()}
        onCancel={() => setConfirm(null)}
      />
    </>
  )
}
