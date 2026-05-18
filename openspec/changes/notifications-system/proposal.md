## Why

After a booking is created, cancelled, or rescheduled, no automated notification reaches the customer, assigned staff, or business owner. Stakeholders must check the app manually to learn about appointment changes. Now that the full appointment lifecycle (booking #17, cancel #22, reschedule #21) is implemented, transactional email is the natural next step.

## What Changes

- New `notification_email` column on `organizations` — optional admin inbox for business-facing copies
- New admin UI field in `AdminSettingsPage` to set `notification_email`
- `admin_update_business_settings` and `get_business_settings` RPCs updated to accept and return `notification_email`
- New Supabase Edge Function `send-appointment-notification` — receives `appointmentId` + `eventType`, fetches enriched data via service-role client, builds HTML email, calls Brevo REST API
- Three inline TypeScript email template builders (confirmation, cancellation, reschedule) — Spanish copy, responsive HTML
- New `src/services/notifications.ts` — fire-and-forget wrapper around the Edge Function invocation
- Hookup calls added to `src/services/appointments.ts` at the three post-RPC success points (replaces existing `// TODO(#27)` comments)

## Capabilities

### New Capabilities

- `appointment-notifications`: Transactional email delivery via Brevo for the three appointment lifecycle events — booking confirmation, cancellation, and reschedule. Covers Edge Function, email templates, notification service, and frontend hookups.

### Modified Capabilities

- `business-settings-profile`: Adds an optional `notification_email` field to the business settings form and the underlying `get_business_settings` / `admin_update_business_settings` RPCs so the business can configure where admin copies are delivered.

## Impact

- **Database**: one new nullable column `organizations.notification_email`; one new migration
- **Backend**: one new Supabase Edge Function (`send-appointment-notification`); two existing RPCs updated
- **Frontend**: `AdminSettingsPage` gains one field; `src/services/appointments.ts` gains three `notifyAppointmentEvent` calls; new `src/services/notifications.ts`
- **Secrets**: `BREVO_API_KEY` and `BREVO_FROM_EMAIL` added to Supabase project secrets (already set)
- **Dependencies**: Brevo REST API (no new npm dependency — uses native `fetch`)
