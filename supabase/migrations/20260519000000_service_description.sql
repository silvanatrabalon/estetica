-- Add description column to services and update admin RPCs to include it.
-- Part of change: booking-experience-service-catalog (#38a)

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Add description column
-- ──────────────────────────────────────────────────────────────────────────────

alter table public.services
  add column if not exists description text;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. admin_list_services — include description
-- Drop first: return type changes (adding description column).
-- ──────────────────────────────────────────────────────────────────────────────

drop function if exists public.admin_list_services();

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
  description             text,
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
    s.description,
    s.created_at
  from public.services s
  where public.is_admin()
  order by s.name asc;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. admin_create_service — accept p_description
-- Drop old signature first since return type changes.
-- ──────────────────────────────────────────────────────────────────────────────

drop function if exists public.admin_create_service(text, integer, integer, text, integer);

create or replace function public.admin_create_service(
  p_name                    text,
  p_duration_minutes        integer,
  p_price_cents             integer,
  p_image_url               text    default null,
  p_max_concurrent_bookings integer default null,
  p_description             text    default null
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
  description             text,
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
    max_concurrent_bookings,
    description
  )
  values (
    v_org_id,
    p_name,
    p_duration_minutes,
    p_price_cents,
    p_image_url,
    p_max_concurrent_bookings,
    p_description
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
      s.description,
      s.created_at
    from public.services s
    where s.id = v_service_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. admin_update_service — accept p_description
-- Drop old signature first since return type changes.
-- ──────────────────────────────────────────────────────────────────────────────

drop function if exists public.admin_update_service(uuid, text, integer, integer, text, integer);

create or replace function public.admin_update_service(
  p_service_id              uuid,
  p_name                    text,
  p_duration_minutes        integer,
  p_price_cents             integer,
  p_image_url               text    default null,
  p_max_concurrent_bookings integer default null,
  p_description             text    default null
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
  description             text,
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
    description             = p_description,
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
      s.description,
      s.created_at
    from public.services s
    where s.id = p_service_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. Grants
-- ──────────────────────────────────────────────────────────────────────────────

grant execute on function public.admin_list_services() to authenticated;
grant execute on function public.admin_create_service(text, integer, integer, text, integer, text) to authenticated;
grant execute on function public.admin_update_service(uuid, text, integer, integer, text, integer, text) to authenticated;
