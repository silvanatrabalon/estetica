-- Migration: add admin_delete_all_appointments RPC.
-- Part of change: business-logic-backend-changes (44c).
-- Deletes ALL appointments for the singleton org; returns deleted row count.

create or replace function public.admin_delete_all_appointments()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_count  integer;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden eliminar turnos.'
      using errcode = 'P0001';
  end if;

  select id into v_org_id from public.organizations limit 1;

  delete from public.appointments
  where organization_id = v_org_id;

  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

grant execute on function public.admin_delete_all_appointments() to authenticated;
