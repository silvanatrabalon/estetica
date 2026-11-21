-- Fix: admin_set_split_shifts failed when called from the app because its
-- `update public.organizations set ...` had no WHERE clause, which the API
-- layer rejects ("UPDATE requires a WHERE clause").

create or replace function public.admin_set_split_shifts(p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  update public.organizations o
     set split_shifts = p_enabled
   where o.id is not null;

  if not p_enabled then
    update public.business_hours
       set opens_at = least(opens_at, pm_opens_at),
           closes_at = greatest(closes_at, pm_closes_at),
           pm_opens_at = null, pm_closes_at = null
     where pm_opens_at is not null;

    update public.staff_schedules
       set starts_at = least(starts_at, pm_starts_at),
           ends_at = greatest(ends_at, pm_ends_at),
           pm_starts_at = null, pm_ends_at = null
     where pm_starts_at is not null;

    update public.staff_schedule_exceptions
       set starts_at = least(starts_at, pm_starts_at),
           ends_at = greatest(ends_at, pm_ends_at),
           pm_starts_at = null, pm_ends_at = null
     where pm_starts_at is not null;
  end if;

  return p_enabled;
end;
$$;
