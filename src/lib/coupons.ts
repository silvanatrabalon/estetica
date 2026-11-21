export type DiscountType = 'percent' | 'fixed'

export interface CouponDiscount {
  type: DiscountType
  /** percent: 1-100. fixed: amount in cents. */
  value: number
}

const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })

/** "10% de descuento" or "$ 500 de descuento". */
export function describeDiscount({ type, value }: CouponDiscount): string {
  return type === 'percent' ? `${value}% de descuento` : `${pesos.format(value / 100)} de descuento`
}

/** Short form for badges: "10% OFF" or "$ 500 OFF". */
export function shortDiscount({ type, value }: CouponDiscount): string {
  return type === 'percent' ? `${value}% OFF` : `${pesos.format(value / 100)} OFF`
}

/** Normalizes what a person types: trims and uppercases ("  verano10 " -> "VERANO10"). */
export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase()
}

/** Spanish error message, or null when the code is acceptable (3-30 letters, digits, - or _). */
export function validateCouponCode(raw: string): string | null {
  const code = normalizeCouponCode(raw)
  if (code.length < 3) return 'El código debe tener al menos 3 caracteres.'
  if (code.length > 30) return 'El código no puede superar los 30 caracteres.'
  if (!/^[A-Z0-9_-]+$/.test(code)) return 'Usá solo letras, números, guiones o guion bajo.'
  return null
}

/** Spanish error message, or null when the value fits the discount type. */
export function validateDiscountValue(type: DiscountType, raw: string): string | null {
  const value = Number(raw)
  if (raw.trim() === '' || !Number.isFinite(value) || value <= 0) return 'Ingresá un valor mayor a cero.'
  if (type === 'percent') {
    if (!Number.isInteger(value)) return 'El porcentaje debe ser un número entero.'
    if (value > 100) return 'El porcentaje no puede superar 100.'
  }
  return null
}

/** Converts what the admin typed to the stored value: percent as is, pesos to cents. */
export function toStoredValue(type: DiscountType, raw: string): number {
  const value = Number(raw)
  return type === 'percent' ? Math.round(value) : Math.round(value * 100)
}

/** Whether a coupon with these dates is usable on the given day (YYYY-MM-DD). */
export function isWithinDates(startsOn: string | null, endsOn: string | null, today: string): boolean {
  if (startsOn && today < startsOn) return false
  if (endsOn && today > endsOn) return false
  return true
}

const COUPON_ERRORS: Record<string, string> = {
  COUPON_NOT_FOUND: 'Ese cupón no existe. Revisá el código.',
  COUPON_INACTIVE: 'Ese cupón ya no está disponible.',
  COUPON_NOT_STARTED: 'Ese cupón todavía no está vigente.',
  COUPON_EXPIRED: 'Ese cupón ya venció.',
  COUPON_WRONG_CATEGORY: 'Ese cupón no aplica a este servicio.',
  COUPON_ALREADY_USED: 'Ya usaste este cupón.',
  COUPON_CODE_INVALID: 'El código debe tener entre 3 y 30 caracteres: letras, números, guiones o guion bajo.',
  COUPON_VALUE_INVALID: 'El valor del descuento no es válido.',
  COUPON_DATES_INVALID: 'La fecha de fin no puede ser anterior a la de inicio.',
  COUPON_NOT_FOR_GUEST: 'Los cupones son solo para clientes con cuenta.',
  COUPON_CODE_TAKEN: 'Ya existe un cupón con ese código.',
}

/** Spanish message for a coupon error coming from the database. */
export function translateCouponError(message: string): string {
  for (const [code, text] of Object.entries(COUPON_ERRORS)) {
    if (message.includes(code)) return text
  }
  return 'No pudimos validar el cupón. Intentá de nuevo.'
}
