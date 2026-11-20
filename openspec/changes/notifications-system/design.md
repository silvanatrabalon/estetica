## Context

The appointment lifecycle (booking, cancellation, reschedule) is fully implemented. No notification mechanism exists yet — stakeholders learn about changes only by checking the app. The business owner does not control DNS for `esteticasobeauty.com`, ruling out Resend (requires domain DNS verification for production sending). Brevo was selected as the email provider because it verifies individual sender email addresses rather than full domains. The sender `mi.estetica.so.beauty@gmail.com` is already verified in Brevo. Secrets `BREVO_API_KEY` and `BREVO_FROM_EMAIL` are already set in the Supabase project.

## Goals / Non-Goals

**Goals:**
- Send transactional email on booking confirmation, cancellation, and reschedule
- Notify customer, assigned staff, and (optionally) the business admin inbox
- Never block the booking UX — email delivery is always fire-and-forget
- Keep email failures silent to the user while logging them for debugging

**Non-Goals:**
- Pre-appointment reminder emails (requires cron/scheduled function)
- Customer opt-out or notification preferences
- WhatsApp, SMS, or push notifications
- Retry queue for failed delivery
- Email open/click tracking
- HTML email preview tooling

## Decisions

### Trigger point: Database trigger + pg_net (not frontend, not inside RPC)

**Decision**: An `AFTER INSERT OR UPDATE` trigger on `public.appointments` calls the `send-appointment-notification` Edge Function through `pg_net` (`net.http_post`). Events: INSERT → `booking_confirmed`; status becomes `cancelled` → `cancelled`; `starts_at` changes on a non-cancelled appointment → `rescheduled`. The function URL and a shared secret are read from Supabase Vault (`notification_function_url`, `notification_webhook_secret`); the Edge Function is deployed with `verify_jwt = false` and authenticates the call with the `x-webhook-secret` header.

**Master switch**: `organizations.notifications_enabled` (default `true`, editable in business settings) is checked by the trigger. It exists because local development points at the production database, so test bookings would otherwise send real emails.

**Why this replaced the original frontend-call design**:
- The email is sent even if the customer closes the tab right after booking.
- It covers every code path that changes an appointment (customer, admin, staff, and the `admin-delete-user` function cancelling appointments), with no per-caller hookups.
- `pg_net` is asynchronous and the trigger swallows all errors, so a notification problem can never block or roll back a booking.

**Alternatives considered**:
- *Frontend service layer*: lost notifications when the tab closes; each new flow needs its own hookup.
- *Inside the SECURITY DEFINER RPC*: couples email delivery to the transaction.

### Email provider: Brevo REST API via native `fetch` (not Resend SDK)

**Decision**: Call `https://api.brevo.com/v3/smtp/email` directly from the Edge Function using Deno's native `fetch`.

**Alternatives considered**:
- *Resend*: Requires full domain DNS verification (TXT + MX records). The user does not control DNS for `esteticasobeauty.com`. Rejected.
- *Brevo SDK (`sib-api-v3-sdk`)*: Not Deno-compatible without shims. REST API is straightforward and sufficient.
- *Brevo REST API via fetch* ✓: Deno-native, no npm dependency, Brevo verifies individual sender addresses (not full domains). Sender already verified.

### Notification delivery: asynchronous and non-blocking

**Decision**: `net.http_post` only enqueues the request; the trigger never waits for the email and wraps everything in an exception handler. The Edge Function returns HTTP 200 even when Brevo fails (errors are logged with `appointmentId` and `eventType`). Each recipient gets their own email, so recipients never see each other's addresses.

### Email templates: inline TypeScript string interpolation (no template engine)

**Decision**: Three pure functions (`buildConfirmationEmail`, `buildCancellationEmail`, `buildRescheduleEmail`) that return `{ subject: string; html: string }`. Templates are simple inline strings with variable interpolation.

**Alternatives considered**:
- *Handlebars / Mustache*: External dependency, not needed for three small templates.
- *MJML*: Build step required; overkill for MVP.
- *Inline TypeScript* ✓: Zero dependencies, colocated with the Edge Function, easy to read and maintain at this scale.

### Admin notification address: `organizations.notification_email` (new optional column)

**Decision**: Add a nullable `notification_email` column to `organizations`. Admin configures it via the business settings form. If null, no admin copy is sent.

**Rationale**: The business owner's Supabase Auth email is not always the right inbox for operational notifications. A dedicated field allows routing to a shared inbox or a different address without changing the admin login.

### Customer email source: `auth.users` via service-role client inside Edge Function

**Decision**: The Edge Function uses a service-role Supabase client to read `auth.users.email` for the customer and staff. This data never passes through the frontend.

**Rationale**: Frontend clients cannot access `auth.users` directly (by design). The Edge Function's privileged context is the correct place to resolve email addresses from user IDs.

## Risks / Trade-offs

- **[Gmail DMARC]** Brevo sends from their infrastructure with `From: mi.estetica.so.beauty@gmail.com`. Gmail's DMARC policy is `p=none` (monitor, not reject), so emails won't be hard-rejected, but some receiving servers may apply extra spam scoring. → Mitigation: Acceptable for MVP volume. Can migrate to a branded domain sender when the business registers one.
- **[Brevo free tier limit]** 300 emails/day on the free plan. Three recipients per event × ~3 events/day = ~9 emails/day at MVP scale — well within limits. → Mitigation: Upgrade if daily appointment volume grows.
- **[Edge Function cold start]** First invocation after idle period adds ~500ms latency. → Mitigation: Fire-and-forget; cold start does not affect the user-visible booking flow.
- **[No delivery confirmation]** Brevo API returns a 2xx but actual inbox delivery is not guaranteed. → Mitigation: Logging inside the Edge Function; no retry in MVP.

## Migration Plan

1. Deploy migration `20260521100000_appointment_notifications.sql`: `pg_net`, `organizations.notification_email`, trigger function and trigger.
2. Set Edge Function secret `NOTIFICATION_WEBHOOK_SECRET` and store the same value plus the function URL in Vault.
3. Deploy Edge Function `send-appointment-notification` (`verify_jwt = false`).
4. Deploy frontend (business settings field for `notification_email`).
5. **Rollback**: drop the trigger; no other part of the app depends on it. If Vault secrets are missing, the trigger silently does nothing.

## Open Questions

_None — all decisions are resolved as of this document._
