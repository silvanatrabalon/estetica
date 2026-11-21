import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildEmail,
  buildRecipients,
  isEventType,
  safeEqual,
  type NotificationData,
} from './logic.ts'

// Called by a database trigger (pg_net) when an appointment is created, cancelled or
// rescheduled. Authenticated with a shared secret header, not a user JWT
// (this function is deployed with verify_jwt = false).

const DEFAULT_SITE_URL = 'https://estetica-so-beauty.vercel.app'
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

interface AppointmentRow {
  id: string
  starts_at: string
  ends_at: string
  customer_user_id: string | null
  guest_name: string | null
  guest_email: string | null
  service: { name: string } | null
  staff: { display_name: string; profile_user_id: string | null } | null
  org: { name: string; timezone: string | null; notification_email: string | null } | null
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // ── Shared-secret auth ────────────────────────────────────────────────────
  const expectedSecret = Deno.env.get('NOTIFICATION_WEBHOOK_SECRET')
  const providedSecret = req.headers.get('x-webhook-secret')
  if (!expectedSecret || !providedSecret || !safeEqual(providedSecret, expectedSecret)) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // ── Body validation ───────────────────────────────────────────────────────
  let appointmentId: string
  let eventType: unknown
  try {
    const body = await req.json()
    appointmentId = body.appointmentId
    eventType = body.eventType
    if (!appointmentId || typeof appointmentId !== 'string') throw new Error('appointmentId')
  } catch {
    return json({ error: 'Invalid body: appointmentId is required' }, 400)
  }

  if (!isEventType(eventType)) {
    return json({ error: 'Invalid eventType' }, 400)
  }

  const brevoKey = Deno.env.get('BREVO_API_KEY')
  const fromEmail = Deno.env.get('BREVO_FROM_EMAIL')
  if (!brevoKey || !fromEmail) {
    console.error('send-appointment-notification: BREVO_API_KEY / BREVO_FROM_EMAIL not configured')
    return json({ sent: 0, skipped: 'not_configured' }, 200)
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── Load enriched appointment ─────────────────────────────────────────────
  const { data, error } = await admin
    .from('appointments')
    .select(
      'id, starts_at, ends_at, customer_user_id, guest_name, guest_email, service:services(name), staff:staff_members(display_name, profile_user_id), org:organizations(name, timezone, notification_email)',
    )
    .eq('id', appointmentId)
    .maybeSingle()

  if (error || !data) {
    console.error('send-appointment-notification: appointment not found', { appointmentId, eventType })
    return json({ sent: 0, skipped: 'appointment_not_found' }, 200)
  }

  const appt = data as unknown as AppointmentRow

  // ── Resolve customer / staff identity ─────────────────────────────────────
  let customerEmail: string | null = null
  let customerName = ''
  if (appt.customer_user_id) {
    const { data: userRes } = await admin.auth.admin.getUserById(appt.customer_user_id)
    customerEmail = userRes?.user?.email ?? null

    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('user_id', appt.customer_user_id)
      .maybeSingle()
    customerName = profile?.full_name ?? ''
  } else {
    // Booked for a person without an account: use what was typed (the email may be empty)
    customerEmail = appt.guest_email ?? null
    customerName = appt.guest_name ?? ''
  }

  let staffEmail: string | null = null
  if (appt.staff?.profile_user_id) {
    const { data: staffRes } = await admin.auth.admin.getUserById(appt.staff.profile_user_id)
    staffEmail = staffRes?.user?.email ?? null
  }

  const recipients = buildRecipients({
    customerEmail,
    staffEmail,
    orgNotificationEmail: appt.org?.notification_email ?? null,
  })

  if (recipients.length === 0) {
    return json({ sent: 0, skipped: 'no_recipients' }, 200)
  }

  const notification: NotificationData = {
    appointmentId: appt.id,
    startsAt: appt.starts_at,
    endsAt: appt.ends_at,
    serviceName: appt.service?.name ?? 'Servicio',
    staffDisplayName: appt.staff?.display_name ?? 'Profesional',
    customerName,
    orgName: appt.org?.name ?? 'Estética',
    orgTimezone: appt.org?.timezone ?? 'UTC',
    siteUrl: Deno.env.get('SITE_URL') ?? DEFAULT_SITE_URL,
  }

  // ── Send one email per recipient (recipients never see each other) ────────
  const results = await Promise.allSettled(
    recipients.map(async (recipient) => {
      const { subject, html } = buildEmail(eventType, notification, recipient.audience)
      const res = await fetch(BREVO_URL, {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { name: notification.orgName, email: fromEmail },
          to: [{ email: recipient.email }],
          subject,
          htmlContent: html,
        }),
      })
      if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 300)
        throw new Error(`Brevo responded ${res.status}: ${detail}`)
      }
    }),
  )

  let sent = 0
  for (const result of results) {
    if (result.status === 'fulfilled') {
      sent += 1
    } else {
      // Never fail the caller because of email delivery problems
      console.error('send-appointment-notification: email failed', {
        appointmentId,
        eventType,
        reason: String(result.reason),
      })
    }
  }

  return json({ sent, failed: results.length - sent }, 200)
})
