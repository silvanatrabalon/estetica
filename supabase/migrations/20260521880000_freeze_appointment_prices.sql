-- Freeze the price of every appointment.
--
-- Income used to fall back to the service's current price for appointments without a stored
-- price, so changing a service price rewrote the history. Now every appointment keeps the price
-- it was booked at:
--   * existing appointments are filled once with the service price as of today (the real
--     historical price was never stored, so this is the closest we can get);
--   * new appointments always get it: create_appointment already sets it, and a trigger covers
--     any other way of inserting one;
--   * the dashboard income numbers read the stored price too.

update public.appointments a
   set price_cents          = s.price_cents,
       original_price_cents = coalesce(a.original_price_cents, s.price_cents),
       discount_cents       = coalesce(a.discount_cents, 0)
  from public.services s
 where s.id = a.service_id
   and a.price_cents is null;

create or replace function public.set_appointment_price_snapshot()
returns trigger
language plpgsql
as $$
begin
  if new.price_cents is null then
    select s.price_cents into new.price_cents from public.services s where s.id = new.service_id;
    new.original_price_cents := coalesce(new.original_price_cents, new.price_cents);
    new.discount_cents := coalesce(new.discount_cents, 0);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_appointments_price_snapshot on public.appointments;
create trigger trg_appointments_price_snapshot
  before insert on public.appointments
  for each row execute function public.set_appointment_price_snapshot();

alter table public.appointments alter column price_cents set not null;

create or replace function public.admin_get_dashboard_stats()
returns table (
  today_count         bigint,
  week_count          bigint,
  month_count         bigint,
  pending_count       bigint,
  confirmed_count     bigint,
  cancelled_count     bigint,
  completed_count     bigint,
  revenue_cents_month bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tz          text;
  v_today_start timestamptz;
  v_today_end   timestamptz;
  v_week_start  timestamptz;
  v_week_end    timestamptz;
  v_month_start timestamptz;
  v_month_end   timestamptz;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden acceder a las estadísticas del panel.'
      using errcode = 'P0001';
  end if;

  -- Resolve org timezone, falling back to UTC
  select coalesce(o.timezone, 'UTC') into v_tz
  from public.organizations o
  limit 1;

  -- Compute time window boundaries in org local time
  v_today_start := date_trunc('day',   now() at time zone v_tz) at time zone v_tz;
  v_today_end   := v_today_start + interval '1 day';
  v_week_start  := date_trunc('week',  now() at time zone v_tz) at time zone v_tz;
  v_week_end    := v_week_start  + interval '1 week';
  v_month_start := date_trunc('month', now() at time zone v_tz) at time zone v_tz;
  v_month_end   := v_month_start + interval '1 month';

  return query
  select
    coalesce(sum(case when a.starts_at >= v_today_start and a.starts_at < v_today_end   then 1 else 0 end), 0)::bigint as today_count,
    coalesce(sum(case when a.starts_at >= v_week_start  and a.starts_at < v_week_end    then 1 else 0 end), 0)::bigint as week_count,
    coalesce(sum(case when a.starts_at >= v_month_start and a.starts_at < v_month_end   then 1 else 0 end), 0)::bigint as month_count,
    coalesce(sum(case when a.status = 'pending'   then 1 else 0 end), 0)::bigint as pending_count,
    coalesce(sum(case when a.status = 'confirmed' then 1 else 0 end), 0)::bigint as confirmed_count,
    coalesce(sum(case
      when a.status = 'cancelled' and a.starts_at >= v_month_start and a.starts_at < v_month_end
      then 1 else 0 end), 0)::bigint as cancelled_count,
    coalesce(sum(case when a.status = 'completed' then 1 else 0 end), 0)::bigint as completed_count,
    -- revenue: price-at-query for completed appointments this month
    coalesce(sum(
      case
        when a.status = 'completed'
          and a.starts_at >= v_month_start
          and a.starts_at < v_month_end
        then coalesce(a.price_cents, s.price_cents)
        else 0
      end
    ), 0)::bigint as revenue_cents_month
  from public.appointments a
  join public.services s on s.id = a.service_id;

end;
$$;

grant execute on function public.admin_get_dashboard_stats() to authenticated;

create or replace function public.admin_get_stats_by_range(
  p_date_from timestamptz,
  p_date_to   timestamptz
)
returns table (
  pending_count   bigint,
  confirmed_count bigint,
  cancelled_count bigint,
  completed_count bigint,
  total_count     bigint,
  revenue_cents   bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden acceder a las estadísticas.'
      using errcode = 'P0001';
  end if;

  return query
  select
    coalesce(sum(case when a.status = 'pending'   then 1 else 0 end), 0)::bigint as pending_count,
    coalesce(sum(case when a.status = 'confirmed' then 1 else 0 end), 0)::bigint as confirmed_count,
    coalesce(sum(case when a.status = 'cancelled' then 1 else 0 end), 0)::bigint as cancelled_count,
    coalesce(sum(case when a.status = 'completed' then 1 else 0 end), 0)::bigint as completed_count,
    count(*)::bigint                                                               as total_count,
    coalesce(sum(
      case when a.status = 'completed' then coalesce(a.price_cents, s.price_cents) else 0 end
    ), 0)::bigint                                                                  as revenue_cents
  from public.appointments a
  join public.services s on s.id = a.service_id
  where a.starts_at >= p_date_from
    and a.starts_at <= p_date_to;

end;
$$;
