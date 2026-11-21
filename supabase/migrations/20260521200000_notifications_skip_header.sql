-- Let a client opt out of notification emails for the requests it makes.
--
-- PostgREST exposes the HTTP request headers to Postgres through the
-- `request.headers` setting. When a request carries `x-skip-notifications: true`
-- the trigger does not call the Edge Function. The local dev app sends this
-- header when VITE_NOTIFICATIONS_ENABLED=false, so testing against the production
-- database never emails real customers. The production app never sends it.
--
-- Everything else is unchanged from 20260521100000_appointment_notifications.sql.

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
  v_skip       text;
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
    -- Client asked to skip notifications for this request (dev/testing)
    begin
      v_skip := nullif(current_setting('request.headers', true), '')::json ->> 'x-skip-notifications';
    exception when others then
      v_skip := null;
    end;
    if lower(coalesce(v_skip, '')) = 'true' then
      return new;
    end if;

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
