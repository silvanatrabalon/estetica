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

### Trigger point: Frontend service layer (not DB trigger, not inside RPC)

**Decision**: Call `notifyAppointmentEvent()` in `src/services/appointments.ts` after each RPC returns successfully.

**Alternatives considered**:
- *DB trigger via `pg_net`*: Would require `pg_net` extension, adds migration complexity, and makes the notification tightly coupled to the transaction. Harder to test and debug.
- *Inside the SECURITY DEFINER RPC*: Couples email delivery to the DB transaction — a Brevo failure could affect RPC behavior. Violates the "email never blocks booking" constraint.
- *Frontend service layer* ✓: Simple, testable, consistent with the BaaS-first philosophy. The service layer already owns the RPC call; adding a fire-and-forget call afterward is minimal complexity.

### Email provider: Brevo REST API via native `fetch` (not Resend SDK)

**Decision**: Call `https://api.brevo.com/v3/smtp/email` directly from the Edge Function using Deno's native `fetch`.

**Alternatives considered**:
- *Resend*: Requires full domain DNS verification (TXT + MX records). The user does not control DNS for `esteticasobeauty.com`. Rejected.
- *Brevo SDK (`sib-api-v3-sdk`)*: Not Deno-compatible without shims. REST API is straightforward and sufficient.
- *Brevo REST API via fetch* ✓: Deno-native, no npm dependency, Brevo verifies individual sender addresses (not full domains). Sender already verified.

### Notification trigger: fire-and-forget (not awaited)

**Decision**: `notifyAppointmentEvent()` does not `await` the Edge Function call. The returned Promise is deliberately discarded. Errors are caught and logged as `console.warn`.

**Rationale**: Email delivery latency (Edge Function cold start + Brevo API round-trip) would add perceptible delay to the booking confirmation, cancel, and reschedule flows. The booking UX must remain snappy regardless of email provider availability.

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

1. Deploy migration: `ALTER TABLE public.organizations ADD COLUMN notification_email text`
2. Update `get_business_settings` and `admin_update_business_settings` RPCs to include `notification_email`
3. Deploy Edge Function `send-appointment-notification`
4. Deploy frontend changes (`AdminSettingsPage`, `notifications.ts`, `appointments.ts` hookups)
5. **No rollback impact**: if the Edge Function is removed, `notifyAppointmentEvent()` calls silently fail (fire-and-forget); the rest of the app is unaffected

## Open Questions

_None — all decisions are resolved as of this document._
