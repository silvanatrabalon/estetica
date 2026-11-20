-- Migration: add get_upcoming_closures RPC.
-- Part of change: business-logic-backend-changes (44b).
-- Accessible to anon and authenticated via SECURITY DEFINER.
-- anon has NO direct SELECT grant on business_closure_exceptions;
-- this RPC is the only public read path.

create or replace function public.get_upcoming_closures()
returns table (
  closure_date date,
  closure_type text,
  starts_at    time,
  ends_at      time,
  reason       text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    bce.closure_date,
    bce.closure_type::text,
    bce.starts_at,
    bce.ends_at,
    bce.reason
  from public.business_closure_exceptions bce
  where bce.closure_date >= current_date
    and bce.closure_date <= current_date + 30
  order by bce.closure_date asc;
$$;

grant execute on function public.get_upcoming_closures() to anon, authenticated;
