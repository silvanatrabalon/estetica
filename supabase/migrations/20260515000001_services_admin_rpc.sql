-- Admin SECURITY DEFINER RPC functions for service catalog management.
-- All functions check is_admin() and raise an exception for unauthorized callers.
-- Follows the admin_create_staff_member / admin_update_staff_member pattern.

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_list_services
-- Returns all services for the organization, ordered by name.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_list_services()
returns table (
  id               uuid,
  organization_id  uuid,
  name             text,
  duration_minutes integer,
  price_cents      integer,
  image_url        text,
  is_active        boolean,
  created_at       timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.organization_id,
    s.name,
    s.duration_minutes,
    s.price_cents,
    s.image_url,
    s.is_active,
    s.created_at
  from public.services s
  where public.is_admin()
  order by s.name asc;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_create_service
-- Creates a new service for the organization.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_create_service(
  p_name             text,
  p_duration_minutes integer,
  p_price_cents      integer,
  p_image_url        text default null
)
returns table (
  id               uuid,
  organization_id  uuid,
  name             text,
  duration_minutes integer,
  price_cents      integer,
  image_url        text,
  is_active        boolean,
  created_at       timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id    uuid;
  v_service_id uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden crear servicios.';
  end if;

  select o.id into v_org_id
  from public.organizations o
  limit 1;

  if v_org_id is null then
    raise exception 'No se encontró la organización.';
  end if;

  insert into public.services (organization_id, name, duration_minutes, price_cents, image_url)
  values (v_org_id, p_name, p_duration_minutes, p_price_cents, p_image_url)
  returning public.services.id into v_service_id;

  return query
    select
      s.id,
      s.organization_id,
      s.name,
      s.duration_minutes,
      s.price_cents,
      s.image_url,
      s.is_active,
      s.created_at
    from public.services s
    where s.id = v_service_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_update_service
-- Updates an existing service's fields.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_update_service(
  p_service_id       uuid,
  p_name             text,
  p_duration_minutes integer,
  p_price_cents      integer,
  p_image_url        text default null
)
returns table (
  id               uuid,
  organization_id  uuid,
  name             text,
  duration_minutes integer,
  price_cents      integer,
  image_url        text,
  is_active        boolean,
  created_at       timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden editar servicios.';
  end if;

  update public.services
  set
    name             = p_name,
    duration_minutes = p_duration_minutes,
    price_cents      = p_price_cents,
    image_url        = p_image_url,
    updated_at       = now()
  where id = p_service_id;

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
      s.created_at
    from public.services s
    where s.id = p_service_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_set_service_active
-- Activates or deactivates a service.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_set_service_active(
  p_service_id uuid,
  p_is_active  boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden cambiar el estado de servicios.';
  end if;

  update public.services
  set
    is_active  = p_is_active,
    updated_at = now()
  where id = p_service_id;

  if not found then
    raise exception 'Servicio no encontrado.';
  end if;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Grants
-- ──────────────────────────────────────────────────────────────────────────────

grant execute on function public.admin_list_services() to authenticated;
grant execute on function public.admin_create_service(text, integer, integer, text) to authenticated;
grant execute on function public.admin_update_service(uuid, text, integer, integer, text) to authenticated;
grant execute on function public.admin_set_service_active(uuid, boolean) to authenticated;
