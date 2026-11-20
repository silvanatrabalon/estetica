-- Appointment email notifications
--
-- 1. organizations.notification_email: optional inbox that receives a copy of every
--    booking / cancellation / reschedule. organizations.notifications_enabled: master switch.
-- 2. Trigger on public.appointments that calls the `send-appointment-notification`
--    Edge Function (via pg_net) after an appointment is created, cancelled or rescheduled.
--
-- The trigger is fire-and-forget: any failure (missing config, network error) is swallowed
-- so a notification problem can NEVER block or roll back a booking.
--
-- Required Vault secrets (set once per project, never committed):
--   notification_function_url     e.g. https://<project-ref>.supabase.co/functions/v1/send-appointment-notification
--   notification_webhook_secret   shared secret, must equal the Edge Function secret NOTIFICATION_WEBHOOK_SECRET

create extension if not exists pg_net with schema extensions;

alter table public.organizations
  add column if not exists notification_email text;

-- Master switch: lets the owner pause every notification email (e.g. while testing
-- against the production database from a local environment).
alter table public.organizations
  add column if not exists notifications_enabled boolean not null default true;

create or replace function public.notify_appointment_event()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault, net
as $$
declare
  v_event_type text;
  v_url        text;
  v_secret     text;
  v_enabled    boolean;
begin
  if tg_op = 'INSERT' then
    v_event_type := 'booking_confirmed';
  elsif tg_op = 'UPDATE' then
    if old.status is distinct from 'cancelled' and new.status = 'cancelled' then
      v_event_type := 'cancelled';
    elsif new.status <> 'cancelled' and old.starts_at is distinct from new.starts_at then
      v_event_type := 'rescheduled';
    end if;
  end if;

  -- Nothing worth notifying (e.g. status moved to completed, notes edited)
  if v_event_type is null then
    return new;
  end if;

  begin
    -- Notifications paused for this organization: skip silently
    select o.notifications_enabled into v_enabled
      from public.organizations o where o.id = new.organization_id;
    if v_enabled is not true then
      return new;
    end if;

    select decrypted_secret into v_url
      from vault.decrypted_secrets where name = 'notification_function_url' limit 1;
    select decrypted_secret into v_secret
      from vault.decrypted_secrets where name = 'notification_webhook_secret' limit 1;

    -- Not configured yet (e.g. local dev): skip silently
    if v_url is null or v_secret is null then
      return new;
    end if;

    perform net.http_post(
      url     := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', v_secret
      ),
      body    := jsonb_build_object(
        'appointmentId', new.id,
        'eventType', v_event_type
      ),
      timeout_milliseconds := 5000
    );
  exception when others then
    raise warning 'notify_appointment_event failed: %', sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function public.notify_appointment_event() from public, anon, authenticated;

drop trigger if exists appointments_notify_event on public.appointments;
create trigger appointments_notify_event
  after insert or update on public.appointments
  for each row
  execute function public.notify_appointment_event();
