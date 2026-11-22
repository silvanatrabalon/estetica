/**
 * Link from the website to a booking: /booking?servicio=<id>, ?promo=<id> or ?cupon=<code>[&categoria=<name>].
 * A visitor without a session is sent to sign in first and comes back to that same booking.
 */
export function bookingHref(isAuthenticated: boolean, params: Record<string, string | null | undefined> = {}): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value)
  }
  const text = query.toString()
  const path = text ? `/booking?${text}` : '/booking'
  return isAuthenticated ? path : `/signin?redirect=${encodeURIComponent(path)}`
}
