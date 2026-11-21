/** Who an appointment is booked for. Only admin and staff can pick something other than "me". */
export type BookingTarget =
  | { kind: 'me' }
  | { kind: 'client'; userId: string }
  | { kind: 'guest'; name: string; phone: string; email: string }

export const DEFAULT_TARGET: BookingTarget = { kind: 'me' }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Spanish error message, or null when the target is complete. */
export function validateBookingTarget(target: BookingTarget): string | null {
  if (target.kind === 'me') return null

  if (target.kind === 'client') {
    return target.userId ? null : 'Elegí al cliente para la reserva.'
  }

  const name = target.name.trim()
  if (name.length < 2) return 'Escribí el nombre de la persona (mínimo 2 letras).'
  if (name.length > 80) return 'El nombre no puede superar los 80 caracteres.'
  if (target.phone.trim().length > 30) return 'El teléfono no puede superar los 30 caracteres.'
  const email = target.email.trim()
  if (email && !EMAIL.test(email)) return 'El email no parece válido.'
  if (email.length > 120) return 'El email no puede superar los 120 caracteres.'
  return null
}

/** What createAppointment needs for this target. */
export function targetToBookingParams(target: BookingTarget): {
  customerUserId?: string
  guest?: { name: string; phone?: string; email?: string }
} {
  if (target.kind === 'client') return { customerUserId: target.userId }
  if (target.kind === 'guest') {
    return { guest: { name: target.name.trim(), phone: target.phone.trim(), email: target.email.trim() } }
  }
  return {}
}

/** Coupons belong to a client account the person typing is not acting as, so only "me" can use one. */
export function canUseCoupon(target: BookingTarget): boolean {
  return target.kind === 'me'
}
