import type { DiscountType } from './coupons'

export interface PromoDiscount {
  type: DiscountType
  /** percent: 1-100. fixed: amount in cents. */
  value: number
}

/** What a promo takes off a price, and what is left to pay. Never below zero. */
export function applyPromo(priceCents: number, promo: PromoDiscount): { discountCents: number; finalCents: number } {
  const raw = promo.type === 'percent' ? Math.round((priceCents * promo.value) / 100) : Math.min(promo.value, priceCents)
  const discountCents = Math.max(0, Math.min(raw, priceCents))
  return { discountCents, finalCents: priceCents - discountCents }
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** "2026-12-31" -> "31 dic 2026"; anything else is returned as it is. */
export function formatPromoDay(day: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) return day
  const month = Number(match[2])
  if (month < 1 || month > 12) return day
  return `${Number(match[3])} ${MONTHS[month - 1]} ${match[1]}`
}

/** "Del 1 jun al 30 jun 2026" (the year is written once when both dates share it). */
export function promoValidityText(startsOn: string, endsOn: string): string {
  const a = /^(\d{4})-\d{2}-\d{2}$/.exec(startsOn)
  const b = /^(\d{4})-\d{2}-\d{2}$/.exec(endsOn)
  if (a && b && a[1] === b[1]) {
    const from = formatPromoDay(startsOn).replace(` ${a[1]}`, '')
    return `Del ${from} al ${formatPromoDay(endsOn)}`
  }
  return `Del ${formatPromoDay(startsOn)} al ${formatPromoDay(endsOn)}`
}

export type PromoStatus = 'upcoming' | 'running' | 'ended' | 'inactive'

/** Where a promo is today (YYYY-MM-DD in the business time zone); a switched-off promo is "inactive". */
export function promoStatus(
  promo: { startsOn: string; endsOn: string; isActive: boolean },
  today: string,
): PromoStatus {
  if (!promo.isActive) return 'inactive'
  if (today < promo.startsOn) return 'upcoming'
  if (today > promo.endsOn) return 'ended'
  return 'running'
}

export const PROMO_STATUS_LABEL: Record<PromoStatus, string> = {
  upcoming: 'Próxima',
  running: 'Vigente',
  ended: 'Vencida',
  inactive: 'Inactiva',
}

const PROMO_ERRORS: Record<string, string> = {
  PROMO_NAME_INVALID: 'El nombre debe tener entre 2 y 60 caracteres.',
  PROMO_DISCOUNT_INVALID: 'El valor del descuento no es válido.',
  PROMO_DATES_INVALID: 'Elegí las dos fechas; la de fin no puede ser anterior a la de inicio.',
  PROMO_NO_SERVICES: 'Elegí al menos un servicio.',
  PROMO_SERVICE_NOT_FOUND: 'Alguno de los servicios elegidos ya no existe.',
  PROMO_NOT_FOUND: 'Esa promo ya no existe.',
}

/** Spanish message for a promo error coming from the database. */
export function translatePromoError(message: string): string {
  for (const [code, text] of Object.entries(PROMO_ERRORS)) {
    if (message.includes(code)) return text
  }
  return 'No pudimos guardar la promo. Intentá de nuevo.'
}

export interface PromoFormValues {
  name: string
  discountType: DiscountType
  discountValue: string
  startsOn: string
  endsOn: string
  serviceIds: string[]
}

export interface PromoFormErrors {
  name?: string
  discountValue?: string
  startsOn?: string
  endsOn?: string
  dates?: string
  services?: string
}

/** Errors in Spanish for each field (empty object when everything is fine). */
export function validatePromoForm(form: PromoFormValues): PromoFormErrors {
  const errors: PromoFormErrors = {}
  const name = form.name.trim()
  if (name.length < 2 || name.length > 60) errors.name = 'El nombre debe tener entre 2 y 60 caracteres.'

  const value = Number(form.discountValue)
  if (form.discountValue.trim() === '' || !Number.isFinite(value) || value <= 0) {
    errors.discountValue = 'Ingresá un valor mayor a cero.'
  } else if (form.discountType === 'percent') {
    if (!Number.isInteger(value)) errors.discountValue = 'El porcentaje debe ser un número entero.'
    else if (value > 100) errors.discountValue = 'El porcentaje no puede superar 100.'
  }

  if (!form.startsOn) errors.startsOn = 'Elegí desde cuándo vale la promo.'
  if (!form.endsOn) errors.endsOn = 'Elegí hasta cuándo vale la promo.'
  if (form.startsOn && form.endsOn && form.startsOn > form.endsOn) {
    errors.dates = 'La fecha de fin no puede ser anterior a la de inicio.'
  }
  if (form.serviceIds.length === 0) errors.services = 'Elegí al menos un servicio.'
  return errors
}
