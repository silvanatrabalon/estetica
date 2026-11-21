-- admin_get_stats: numbers for the Estadísticas screen.
--
-- Counts only appointments that already took place: status confirmed or completed and a start
-- time in the past. Cancelled and upcoming appointments are not income yet.
-- Income is the price actually charged (price_cents, after any coupon); appointments created
-- before prices were stored fall back to the service's current price.
--
-- Returns one JSON object:
--   totals        { services, revenue_cents, clients }              for the period
--   professionals [{ staff_member_id, display_name, services, revenue_cents }]   for the period
--   months        [{ month 'YYYY-MM', services, revenue_cents }]    last 12 months (not filtered)
--   clients       [{ customer_user_id, name, visits, spent_cents }] top 10 for the period

create or replace function public.admin_get_stats(p_from date default null, p_to date default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_tz          text;
  v_month_start date;
  v_result      jsonb;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden ver las estadísticas.' using errcode = 'P0001';
  end if;

  select coalesce(o.timezone, 'UTC') into v_tz from public.organizations o limit 1;
  v_tz := coalesce(v_tz, 'UTC');
  v_month_start := date_trunc('month', now() at time zone v_tz)::date;

  with done as (
    select a.staff_member_id,
           a.customer_user_id,
           (a.starts_at at time zone v_tz)::date as local_day,
           coalesce(a.price_cents, s.price_cents) as revenue
      from public.appointments a
      join public.services s on s.id = a.service_id
     where a.status in ('confirmed', 'completed')
       and a.starts_at < now()
  ),
  period as (
    select * from done d
     where (p_from is null or d.local_day >= p_from) and (p_to is null or d.local_day <= p_to)
  ),
  totals as (
    select count(*) as services,
           coalesce(sum(revenue), 0) as revenue_cents,
           count(distinct customer_user_id) as clients
      from period
  ),
  pros as (
    select sm.id as staff_member_id,
           sm.display_name::text as display_name,
           count(pd.*) as services,
           coalesce(sum(pd.revenue), 0) as revenue_cents
      from public.staff_members sm
      left join period pd on pd.staff_member_id = sm.id
     where sm.is_active
     group by sm.id, sm.display_name
  ),
  months as (
    select m.month_start::date as month_start,
           coalesce(t.services, 0) as services,
           coalesce(t.revenue, 0) as revenue_cents
      from generate_series(v_month_start - interval '11 months', v_month_start, interval '1 month') as m(month_start)
      left join (
        select date_trunc('month', d.local_day)::date as month_start, count(*) as services, sum(d.revenue) as revenue
          from done d
         group by 1
      ) t on t.month_start = m.month_start::date
  ),
  top_clients as (
    select pd.customer_user_id,
           coalesce(nullif(btrim(p.full_name), ''), au.email, 'Cliente sin nombre')::text as name,
           count(*) as visits,
           coalesce(sum(pd.revenue), 0) as spent_cents
      from period pd
      left join public.profiles p on p.user_id = pd.customer_user_id
      left join auth.users au on au.id = pd.customer_user_id
     group by pd.customer_user_id, p.full_name, au.email
     order by count(*) desc, coalesce(sum(pd.revenue), 0) desc
     limit 10
  )
  select jsonb_build_object(
    'totals', (select to_jsonb(t) from totals t),
    'professionals', (select coalesce(jsonb_agg(to_jsonb(x) order by x.services desc, x.revenue_cents desc), '[]'::jsonb) from pros x),
    'months', (select coalesce(jsonb_agg(jsonb_build_object(
                  'month', to_char(m.month_start, 'YYYY-MM'),
                  'services', m.services,
                  'revenue_cents', m.revenue_cents) order by m.month_start), '[]'::jsonb) from months m),
    'clients', (select coalesce(jsonb_agg(to_jsonb(c) order by c.visits desc, c.spent_cents desc), '[]'::jsonb) from top_clients c)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_get_stats(date, date) from public, anon;
grant execute on function public.admin_get_stats(date, date) to authenticated;
