## 1. Database

- [ ] 1.1 Write migration: `ALTER TABLE public.organizations ADD COLUMN notification_email text`
- [ ] 1.2 Update `get_business_settings` RPC to include `notification_email` in its SELECT and return shape
- [ ] 1.3 Update `admin_update_business_settings` RPC to accept `p_notification_email text` parameter and persist it

## 2. Edge Function scaffold

- [ ] 2.1 Create `supabase/functions/send-appointment-notification/index.ts` with Deno entry point and CORS headers
- [ ] 2.2 Implement JWT validation — extract and verify Authorization header; return 401 if missing or invalid
- [ ] 2.3 Implement request body parsing and `eventType` validation — return 400 for unknown event types
- [ ] 2.4 Implement enriched appointment fetch via service-role Supabase client: JOIN `auth.users`, `profiles`, `services`, `staff_members`, `organizations` in one query using `appointmentId`

## 3. Email dispatch logic

- [ ] 3.1 Implement recipient collection: resolve customer email, staff email (nullable), and `orgNotificationEmail` (nullable)
- [ ] 3.2 Implement case-insensitive deduplication using `Set<string>` before sending
- [ ] 3.3 Implement Brevo REST API call via native `fetch` to `https://api.brevo.com/v3/smtp/email` using `BREVO_API_KEY` and `BREVO_FROM_EMAIL` secrets
- [ ] 3.4 Wrap Brevo call in try/catch — log error with `appointmentId` and `eventType`; always return HTTP 200

## 4. Email templates

- [ ] 4.1 Implement `buildConfirmationEmail(data)` — Spanish subject `"Turno confirmado · {serviceName}"`, HTML body with customer name, service, formatted date/time, staff name, booking reference, and CTA link to appointment detail
- [ ] 4.2 Implement `buildCancellationEmail(data)` — Spanish subject `"Turno cancelado · {serviceName}"`, HTML body confirming cancellation with service name and original date/time
- [ ] 4.3 Implement `buildRescheduleEmail(data)` — Spanish subject `"Turno reprogramado · {serviceName}"`, HTML body with service name and new date/time, CTA link to appointment detail
- [ ] 4.4 Format `startsAt` and `endsAt` in `organizations.timezone` with Spanish locale inside the Edge Function (use `Intl.DateTimeFormat`)

## 5. Notification service

- [ ] 5.1 Create `src/services/notifications.ts` exporting `NotificationEventType` and `notifyAppointmentEvent(appointmentId, eventType)` — calls `supabase.functions.invoke` without `await`, catches and logs all errors silently

## 6. Frontend hookups

- [ ] 6.1 In `createAppointment()`: replace `// TODO(#27)` comment with `notifyAppointmentEvent(result.id, 'booking_confirmed')`
- [ ] 6.2 In `cancelAppointment()`: replace `// TODO(#27)` comment with `notifyAppointmentEvent(result.id, 'cancelled')`
- [ ] 6.3 In `rescheduleAppointment()`: replace `// TODO(#27)` comment with `notifyAppointmentEvent(result.id, 'rescheduled')`

## 7. Admin settings UI

- [ ] 7.1 Add `notification_email` text input (type email) to `AdminSettingsPage` business settings form with label "Email para notificaciones del negocio" and helper text
- [ ] 7.2 Add client-side email format validation with Spanish error message
- [ ] 7.3 Wire field to `get_business_settings` load (populate on mount) and `admin_update_business_settings` save

## 8. Tests

- [ ] 8.1 SQL smoke tests: `admin_update_business_settings` persists `notification_email`; `get_business_settings` returns it; `notification_email` is null on existing org rows after migration
- [ ] 8.2 Edge Function unit tests: valid JWT + valid `appointmentId` dispatches correct template; invalid/missing JWT returns 401; unknown `eventType` returns 400; Brevo failure returns 200 with error log; null `staffEmail` skips staff send; null `orgNotificationEmail` skips admin send
- [ ] 8.3 Edge Function deduplication unit tests: all three addresses identical → one send; two identical + one distinct → two sends; three distinct → three sends
- [ ] 8.4 Template unit tests: each builder returns Spanish subject and HTML containing required data fields (service name, date/time, booking reference)
- [ ] 8.5 Service unit tests: `notifyAppointmentEvent` invokes Edge Function with correct `appointmentId` and `eventType`; does not throw when invocation fails (fire-and-forget semantics)
- [ ] 8.6 Appointment service unit tests: `cancelAppointment` RPC failure → `notifyAppointmentEvent` not called; `cancelAppointment` success → `notifyAppointmentEvent('cancelled')` called (same for create and reschedule)
- [ ] 8.7 Integration tests: `createAppointment` success → Edge Function invoked with `'booking_confirmed'`; `cancelAppointment` success → `'cancelled'`; `rescheduleAppointment` success → `'rescheduled'`; admin settings form saves `notification_email` and displays Spanish success message
