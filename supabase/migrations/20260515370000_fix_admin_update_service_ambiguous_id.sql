-- Fix: admin_update_service UPDATE WHERE clause uses unqualified 'id'.
-- Error 42702 "column reference 'id' is ambiguous" because RETURNS TABLE
-- declares 'id' as an OUT parameter in PL/pgSQL scope.
-- Fix: qualify the WHERE predicate with the table name.

create or replace function public.admin_update_service(
  p_service_id              uuid,
  p_name                    text,
  p_duration_minutes        integer,
  p_price_cents             integer,
  p_image_url               text    default null,
  p_max_concurrent_bookings integer default null
)
returns table (
  id                      uuid,
  organization_id         uuid,
  name                    text,
  duration_minutes        integer,
  price_cents             integer,
  image_url               text,
  is_active               boolean,
  max_concurrent_bookings integer,
  created_at              timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden editar servicios.';
  end if;

  update public.services svc
  set
    name                    = p_name,
    duration_minutes        = p_duration_minutes,
    price_cents             = p_price_cents,
    image_url               = p_image_url,
    max_concurrent_bookings = p_max_concurrent_bookings,
    updated_at              = now()
  where svc.id = p_service_id;

  if not found then
    raise exception 'Servicio no encontrado.';
  end if;

  return query
    select
      s.id,
      s.organization_id,
      s.name,
      s.duration_minutes,
      s.price_cents,
      s.image_url,
      s.is_active,
      s.max_concurrent_bookings,
      s.created_at
    from public.services s
    where s.id = p_service_id;
end;
$$;
