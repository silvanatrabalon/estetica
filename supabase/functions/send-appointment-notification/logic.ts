// Pure logic for appointment notification emails.
// No Deno globals or remote imports here so it can be unit tested with vitest.

export type NotificationEventType = 'booking_confirmed' | 'cancelled' | 'rescheduled'

export const EVENT_TYPES: NotificationEventType[] = ['booking_confirmed', 'cancelled', 'rescheduled']

export function isEventType(value: unknown): value is NotificationEventType {
  return typeof value === 'string' && (EVENT_TYPES as string[]).includes(value)
}

export interface NotificationData {
  appointmentId: string
  startsAt: string
  endsAt: string
  serviceName: string
  staffDisplayName: string
  customerName: string
  orgName: string
  orgTimezone: string
  siteUrl: string
}

export type Audience = 'customer' | 'business'

export interface Recipient {
  email: string
  audience: Audience
}

export interface BuiltEmail {
  subject: string
  html: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string | null | undefined): value is string {
  return typeof value === 'string' && EMAIL_REGEX.test(value.trim())
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Formats a UTC ISO timestamp in the organization's timezone using Spanish (es-AR).
 * Falls back to UTC when the timezone is empty or invalid.
 */
export function formatDateTime(isoUtc: string, timezone: string): string {
  const date = new Date(isoUtc)
  if (Number.isNaN(date.getTime())) return isoUtc

  let tz = 'UTC'
  if (timezone) {
    try {
      new Intl.DateTimeFormat('es-AR', { timeZone: timezone })
      tz = timezone
    } catch {
      // invalid timezone: keep UTC
    }
  }

  const formatted = new Intl.DateTimeFormat('es-AR', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/** Short, human-friendly booking reference derived from the appointment id. */
export function bookingReference(appointmentId: string): string {
  return appointmentId.replace(/-/g, '').slice(0, 8).toUpperCase()
}

/**
 * Builds the unique list of recipients: the customer, the professional of the appointment and every
 * administrator that has the copies on. Addresses are compared
 * case-insensitively. If the same address appears twice (for example an administrator who is also the
 * professional, or who booked for themself) it receives one email, the customer version first.
 * Invalid or empty addresses are skipped.
 */
export function buildRecipients(input: {
  customerEmail?: string | null
  staffEmail?: string | null
  /** The email of every administrator that has the copies on (Negocio > Política). */
  adminEmails?: Array<string | null | undefined>
}): Recipient[] {
  const seen = new Set<string>()
  const recipients: Recipient[] = []

  const add = (email: string | null | undefined, audience: Audience) => {
    if (!isValidEmail(email)) return
    const normalized = email.trim().toLowerCase()
    if (seen.has(normalized)) return
    seen.add(normalized)
    recipients.push({ email: email.trim(), audience })
  }

  add(input.customerEmail, 'customer')
  add(input.staffEmail, 'business')
  for (const email of input.adminEmails ?? []) add(email, 'business')

  return recipients
}

const TITLES: Record<NotificationEventType, { customer: string; business: string }> = {
  booking_confirmed: { customer: 'Turno confirmado', business: 'Nuevo turno' },
  cancelled: { customer: 'Turno cancelado', business: 'Turno cancelado' },
  rescheduled: { customer: 'Turno reprogramado', business: 'Turno reprogramado' },
}

const INTROS: Record<NotificationEventType, (customerName: string) => { customer: string; business: string }> = {
  booking_confirmed: (name) => ({
    customer: `Hola ${name}, tu turno quedó confirmado. Estos son los detalles:`,
    business: `Se registró un nuevo turno de ${name}:`,
  }),
  cancelled: (name) => ({
    customer: `Hola ${name}, tu turno fue cancelado. Estos eran los detalles:`,
    business: `Se canceló el turno de ${name}:`,
  }),
  rescheduled: (name) => ({
    customer: `Hola ${name}, tu turno fue reprogramado. Estos son los nuevos detalles:`,
    business: `Se reprogramó el turno de ${name}. Nuevo horario:`,
  }),
}

export function buildEmail(
  eventType: NotificationEventType,
  data: NotificationData,
  audience: Audience,
): BuiltEmail {
  const service = escapeHtml(data.serviceName)
  const staff = escapeHtml(data.staffDisplayName)
  const org = escapeHtml(data.orgName)
  const customerName = data.customerName.trim() ? escapeHtml(data.customerName.trim()) : 'cliente'
  const when = escapeHtml(formatDateTime(data.startsAt, data.orgTimezone))
  const reference = bookingReference(data.appointmentId)

  const title = TITLES[eventType][audience]
  const intro = INTROS[eventType](customerName)[audience]

  const subject = `${title} · ${data.serviceName}`

  const showCta = audience === 'customer' && eventType !== 'cancelled'
  const detailUrl = `${data.siteUrl.replace(/\/$/, '')}/booking/confirmation/${encodeURIComponent(data.appointmentId)}`
  const cta = showCta
    ? `<p style="margin:24px 0 0"><a href="${escapeHtml(detailUrl)}" style="background:#0d9488;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Ver mi turno</a></p>`
    : ''

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#222">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
<h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h1>
<p style="margin:0 0 16px">${intro}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px">
<tr><td style="padding:6px 0;color:#666">Servicio</td><td style="padding:6px 0;text-align:right"><strong>${service}</strong></td></tr>
<tr><td style="padding:6px 0;color:#666">Fecha y hora</td><td style="padding:6px 0;text-align:right"><strong>${when}</strong></td></tr>
<tr><td style="padding:6px 0;color:#666">Profesional</td><td style="padding:6px 0;text-align:right"><strong>${staff}</strong></td></tr>
<tr><td style="padding:6px 0;color:#666">Referencia</td><td style="padding:6px 0;text-align:right"><strong>${reference}</strong></td></tr>
</table>
${cta}
<p style="margin:28px 0 0;font-size:12px;color:#888">${org}</p>
</div></body></html>`

  return { subject, html }
}

/** Constant-time string comparison to validate the shared webhook secret. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
