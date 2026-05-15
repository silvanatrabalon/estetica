-- Fix: admin_update_booking_policy UPDATE missing WHERE clause.
-- Error 21000 "UPDATE requires a WHERE clause" is raised when UPDATE
-- has no predicate. Fetch the singleton org id first, then scope the UPDATE.

create or replace function public.admin_update_booking_policy(
  p_min_notice_minutes integer,
  p_max_horizon_days   integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden configurar la política de reservas.';
  end if;

  select org.id
    into v_org_id
    from public.organizations org
    limit 1;

  if v_org_id is null then
    raise exception 'No se encontró la configuración de la organización.';
  end if;

  update public.organizations
     set booking_min_notice_minutes = p_min_notice_minutes,
         booking_max_horizon_days   = p_max_horizon_days,
         updated_at                 = now()
   where id = v_org_id;
end;
$$;
