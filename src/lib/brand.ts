export const BOOKING_HEADER_MAX = 80
export const BOOKING_SUBTITLE_MAX = 160

export const DEFAULT_BOOKING_HEADER = 'Reservar turno'
export const DEFAULT_BOOKING_SUBTITLE = 'Elegí el servicio que querés reservar.'

/** Returns a Spanish error message for the first invalid field, or null. */
export function validateBrandTexts(input: {
  bookingHeaderText?: string | null
  bookingSubtitleText?: string | null
}): string | null {
  if ((input.bookingHeaderText ?? '').trim().length > BOOKING_HEADER_MAX) {
    return `El título de la reserva no puede superar los ${BOOKING_HEADER_MAX} caracteres.`
  }
  if ((input.bookingSubtitleText ?? '').trim().length > BOOKING_SUBTITLE_MAX) {
    return `El subtítulo de la reserva no puede superar los ${BOOKING_SUBTITLE_MAX} caracteres.`
  }
  return null
}

/** Booking page copy: admin text when present, otherwise the default. */
export function resolveBookingTexts(input: {
  bookingHeaderText?: string | null
  bookingSubtitleText?: string | null
}): { header: string; subtitle: string } {
  return {
    header: input.bookingHeaderText?.trim() || DEFAULT_BOOKING_HEADER,
    subtitle: input.bookingSubtitleText?.trim() || DEFAULT_BOOKING_SUBTITLE,
  }
}
