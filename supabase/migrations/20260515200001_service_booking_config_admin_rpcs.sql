-- Service Booking Configuration: admin RPC functions.
-- Covers:
--   15a: admin_list/add/remove_service_available_dates
--   15b: extend admin_list_services, admin_create_service, admin_update_service with max_concurrent_bookings
--   15c: admin_update_booking_policy
--
-- Note: admin_list_services, admin_create_service, and admin_update_service are dropped and
-- recreated with updated return types / parameters to include max_concurrent_bookings.

-- ──────────────────────────────────────────────────────────────────────────────
-- Drop existing service functions that need signature/return-type changes
-- ──────────────────────────────────────────────────────────────────────────────

drop function if exists public.admin_list_services();
drop function if exists public.admin_create_service(text, integer, integer, text);
drop function if exists public.admin_update_service(uuid, text, integer, integer, text);

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_list_services (updated: includes max_concurrent_bookings)
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_list_services()
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
    s.max_concurrent_bookings,
    s.created_at
  from public.services s
  where public.is_admin()
  order by s.name asc;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_create_service (updated: includes max_concurrent_bookings)
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_create_service(
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
declare
  v_org_id     uuid;
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

  insert into public.services (
    organization_id,
    name,
    duration_minutes,
    price_cents,
    image_url,
    max_concurrent_bookings
  )
  values (
    v_org_id,
    p_name,
    p_duration_minutes,
    p_price_cents,
    p_image_url,
    p_max_concurrent_bookings
  )
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
      s.max_concurrent_bookings,
      s.created_at
    from public.services s
    where s.id = v_service_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_update_service (updated: includes max_concurrent_bookings)
-- ──────────────────────────────────────────────────────────────────────────────

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

  update public.services
  set
    name                    = p_name,
    duration_minutes        = p_duration_minutes,
    price_cents             = p_price_cents,
    image_url               = p_image_url,
    max_concurrent_bookings = p_max_concurrent_bookings,
    updated_at              = now()
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
      s.max_concurrent_bookings,
      s.created_at
    from public.services s
    where s.id = p_service_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 15a: admin_list_service_available_dates
-- Returns all configured available dates for a service.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_list_service_available_dates(
  p_service_id uuid
)
returns table (
  service_id      uuid,
  available_date  date,
  created_at      timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sad.service_id,
    sad.available_date,
    sad.created_at
  from public.service_available_dates sad
  where sad.service_id = p_service_id
    and public.is_admin()
  order by sad.available_date desc;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 15a: admin_add_service_available_date
-- Adds a specific calendar date to a service's availability whitelist.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_add_service_available_date(
  p_service_id uuid,
  p_date       date
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
    raise exception 'No autorizado: solo administradores pueden gestionar disponibilidad de servicios.';
  end if;

  select s.organization_id into v_org_id
  from public.services s
  where s.id = p_service_id;

  if v_org_id is null then
    raise exception 'Servicio no encontrado.';
  end if;

  insert into public.service_available_dates (service_id, organization_id, available_date)
  values (p_service_id, v_org_id, p_date);
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 15a: admin_remove_service_available_date
-- Removes a specific calendar date from a service's availability whitelist.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_remove_service_available_date(
  p_service_id uuid,
  p_date       date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden gestionar disponibilidad de servicios.';
  end if;

  delete from public.service_available_dates
  where service_id = p_service_id
    and available_date = p_date;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 15c: admin_update_booking_policy
-- Updates the global booking policy on the singleton organization record.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_update_booking_policy(
  p_min_notice_minutes integer,
  p_max_horizon_days   integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden configurar la política de reservas.';
  end if;

  update public.organizations
  set
    booking_min_notice_minutes = p_min_notice_minutes,
    booking_max_horizon_days   = p_max_horizon_days,
    updated_at                 = now();
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Grants
-- ──────────────────────────────────────────────────────────────────────────────

grant execute on function public.admin_list_services() to authenticated;
grant execute on function public.admin_create_service(text, integer, integer, text, integer) to authenticated;
grant execute on function public.admin_update_service(uuid, text, integer, integer, text, integer) to authenticated;
grant execute on function public.admin_list_service_available_dates(uuid) to authenticated;
grant execute on function public.admin_add_service_available_date(uuid, date) to authenticated;
grant execute on function public.admin_remove_service_available_date(uuid, date) to authenticated;
grant execute on function public.admin_update_booking_policy(integer, integer) to authenticated;
