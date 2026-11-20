## 1. Database

- [x] 1.1 Migration: `organizations.notification_email text`, `pg_net` extension
- [x] 1.2 Trigger function `notify_appointment_event()` (booking_confirmed / cancelled / rescheduled) reading URL and secret from Vault; errors swallowed
- [x] 1.3 Trigger `appointments_notify_event` (after insert or update)
- [x] 1.3b `organizations.notifications_enabled` master switch (default true) respected by the trigger
- [ ] 1.4 Apply migration to production and store Vault secrets (`notification_function_url`, `notification_webhook_secret`)

## 2. Edge Function

- [x] 2.1 `supabase/functions/send-appointment-notification/index.ts` with `verify_jwt = false` and shared-secret auth (401 otherwise)
- [x] 2.2 Body validation (400 for missing `appointmentId` or unknown `eventType`)
- [x] 2.3 Enriched appointment fetch with service-role client (customer, staff, service, organization)
- [x] 2.4 Recipient collection with case-insensitive deduplication; one email per recipient
- [x] 2.5 Brevo REST call via `fetch` using `BREVO_API_KEY` and `BREVO_FROM_EMAIL`; failures logged, always HTTP 200
- [ ] 2.6 Deploy the function and set `NOTIFICATION_WEBHOOK_SECRET`

## 3. Email templates (`logic.ts`)

- [x] 3.1 Spanish subjects: "Turno confirmado", "Turno cancelado", "Turno reprogramado" (business copy: "Nuevo turno")
- [x] 3.2 Date/time formatted in the organization timezone (es-AR), HTML-escaped user fields, CTA link for customers

## 4. Admin settings UI

- [x] 4.1 `notification_email` field in `BusinessSettingsPage` ("Email para notificaciones del negocio")
- [x] 4.2 Optional + format validation with Spanish error message
- [x] 4.2b "Enviar notificaciones por email" checkbox (pause emails while testing against production)
- [x] 4.3 Wired to `getBusinessSettings` / `saveBusinessSettings`

## 5. Tests

- [x] 5.1 Unit tests for recipients/deduplication, templates, escaping, timezone formatting, secret comparison
- [x] 5.2 Validation, settings page and service tests for the notification email field
- [ ] 5.3 End-to-end check in production: create, reschedule and cancel an appointment and confirm the emails arrive

> The original frontend service-layer hookups (`notifications.ts`, `appointments.ts`) were dropped in favor of the database trigger.
