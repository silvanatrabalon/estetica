-- Migration: drop NOT NULL constraint from appointments.created_by_user_id.
-- Part of change: business-logic-backend-changes (44e).
-- Required before the admin-delete-user Edge Function can safely NULL the column.

alter table public.appointments
  alter column created_by_user_id drop not null;
