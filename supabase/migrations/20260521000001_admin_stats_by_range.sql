-- Migration: add admin_get_stats_by_range RPC.
-- Part of change: business-logic-backend-changes (44d).

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
      case when a.status = 'completed' then s.price_cents else 0 end
    ), 0)::bigint                                                                  as revenue_cents
  from public.appointments a
  join public.services s on s.id = a.service_id
  where a.starts_at >= p_date_from
    and a.starts_at <= p_date_to;

end;
$$;

grant execute on function public.admin_get_stats_by_range(timestamptz, timestamptz) to authenticated;
