import { FormEvent, useEffect, useState } from 'react'
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [form, setForm] = useState<FormState | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSaving, setIsSaving] = useState(false)

  const [confirm, setConfirm] = useState<{ coupon: AdminCoupon } | null>(null)

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

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const openEdit = (coupon: AdminCoupon) => {
    setForm(toForm(coupon))
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
    setErrorMessage(null)
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
      setForm(null)
      await load()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No pudimos guardar el cupón.')
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-shell-text">Cupones</h1>
            <p className="text-sm text-shell-subtleText">
              Descuentos que tus clientes cargan al reservar. Cada cliente puede usar un cupón una vez.
            </p>
          </div>
          {form === null && (
            <button
              type="button"
              onClick={openCreate}
              className="shrink-0 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              + Nuevo cupón
            </button>
          )}
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

        {form !== null && (
          <form
            onSubmit={(e) => void handleSubmit(e)}
            noValidate
            className="space-y-3 rounded-2xl border border-shell-border bg-white p-4 shadow-sm"
          >
            <h2 className="text-base font-semibold text-shell-text">{form.id ? 'Editar cupón' : 'Nuevo cupón'}</h2>

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

            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700">Tipo de descuento</span>
              <div role="radiogroup" aria-label="Tipo de descuento" className="grid grid-cols-2 gap-2">
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
                      'rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
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
              {errors.discountValue && <p className="mt-1 text-sm text-red-600">{errors.discountValue}</p>}
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="coupon-starts" className="mb-1 block text-sm font-medium text-gray-700">
                  Desde <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  id="coupon-starts"
                  type="date"
                  value={form.startsOn}
                  onChange={(e) => setField('startsOn', e.target.value)}
                  className={fieldCls}
                />
              </div>
              <div>
                <label htmlFor="coupon-ends" className="mb-1 block text-sm font-medium text-gray-700">
                  Hasta <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  id="coupon-ends"
                  type="date"
                  value={form.endsOn}
                  onChange={(e) => setField('endsOn', e.target.value)}
                  className={fieldCls}
                />
              </div>
              {errors.dates && <p className="col-span-2 text-sm text-red-600">{errors.dates}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm text-shell-text">
              <input
                type="checkbox"
                checked={form.showOnSite}
                onChange={(e) => setField('showOnSite', e.target.checked)}
                className="h-4 w-4"
              />
              Mostrar este cupón en el sitio web
            </label>
            <label className="flex items-center gap-2 text-sm text-shell-text">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField('isActive', e.target.checked)}
                className="h-4 w-4"
              />
              Cupón activo
            </label>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
            </div>
          </form>
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
                    <p className="font-mono text-base font-bold text-shell-text">{coupon.code}</p>
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
                  {coupon.showOnSite && (
                    <span className="rounded-full bg-[var(--color-peach)] px-2 py-0.5 text-[var(--color-peach-ink)]">
                      En el sitio web
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs font-semibold">
                  <button type="button" onClick={() => openEdit(coupon)} className="text-brand-primary hover:underline">
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(coupon)}
                    className="text-shell-subtleText hover:text-shell-text hover:underline"
                  >
                    {coupon.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirm({ coupon })}
                    className="text-red-500 hover:text-red-700 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

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
