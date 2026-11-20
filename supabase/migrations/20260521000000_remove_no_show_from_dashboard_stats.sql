-- Migration: remove no_show_count from admin_get_dashboard_stats return shape.
-- Part of change: business-logic-backend-changes (44a — BREAKING).
-- Must be deployed atomically with the TypeScript interface update.

drop function if exists public.admin_get_dashboard_stats();

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
    coalesce(sum(case when a.status = 'cancelled' then 1 else 0 end), 0)::bigint as cancelled_count,
    coalesce(sum(case when a.status = 'completed' then 1 else 0 end), 0)::bigint as completed_count,
    -- revenue: price-at-query for completed appointments this month
    coalesce(sum(
      case
        when a.status = 'completed'
          and a.starts_at >= v_month_start
          and a.starts_at < v_month_end
        then s.price_cents
        else 0
      end
    ), 0)::bigint as revenue_cents_month
  from public.appointments a
  join public.services s on s.id = a.service_id;

end;
$$;

grant execute on function public.admin_get_dashboard_stats() to authenticated;
