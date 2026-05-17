-- Service categories CRUD RPCs + updated admin_list/create/update_service + list_services.
-- Part of change: service-categories

-- ─── admin_list_categories ────────────────────────────────────────────────────

create or replace function public.admin_list_categories()
returns table (
  id            uuid,
  name          text,
  display_order integer,
  created_at    timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sc.id,
    sc.name,
    sc.display_order,
    sc.created_at
  from public.service_categories sc
  where public.is_admin()
  order by sc.display_order asc, sc.name asc;
$$;

grant execute on function public.admin_list_categories() to authenticated;

-- ─── admin_create_category ────────────────────────────────────────────────────

create or replace function public.admin_create_category(
  p_name          text,
  p_display_order integer default 0
)
returns table (
  id            uuid,
  name          text,
  display_order integer,
  created_at    timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_cat_id uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden crear categorías.';
  end if;

  select o.id into v_org_id
  from public.organizations o
  limit 1;

  if v_org_id is null then
    raise exception 'No se encontró la organización.';
  end if;

  insert into public.service_categories (organization_id, name, display_order)
  values (v_org_id, p_name, p_display_order)
  returning service_categories.id into v_cat_id;

  return query
    select sc.id, sc.name, sc.display_order, sc.created_at
    from public.service_categories sc
    where sc.id = v_cat_id;
end;
$$;

grant execute on function public.admin_create_category(text, integer) to authenticated;

-- ─── admin_update_category ────────────────────────────────────────────────────

create or replace function public.admin_update_category(
  p_id            uuid,
  p_name          text,
  p_display_order integer
)
returns table (
  id            uuid,
  name          text,
  display_order integer,
  created_at    timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden editar categorías.';
  end if;

  update public.service_categories sc
  set
    name          = p_name,
    display_order = p_display_order,
    updated_at    = now()
  where sc.id = p_id;

  if not found then
    raise exception 'Categoría no encontrada.';
  end if;

  return query
    select sc.id, sc.name, sc.display_order, sc.created_at
    from public.service_categories sc
    where sc.id = p_id;
end;
$$;

grant execute on function public.admin_update_category(uuid, text, integer) to authenticated;

-- ─── admin_delete_category ────────────────────────────────────────────────────

create or replace function public.admin_delete_category(
  p_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden eliminar categorías.';
  end if;

  select count(*) into v_count
  from public.services s
  where s.category_id = p_id;

  if v_count > 0 then
    raise exception 'Esta categoría tiene servicios asignados. Reasignalos antes de eliminar.';
  end if;

  delete from public.service_categories sc where sc.id = p_id;

  if not found then
    raise exception 'Categoría no encontrada.';
  end if;
end;
$$;

grant execute on function public.admin_delete_category(uuid) to authenticated;

-- ─── admin_list_services — add category_id, category_name ────────────────────
-- Return type changes: drop first to allow recreation.

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
  category_id             uuid,
  category_name           text,
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
    s.category_id,
    sc.name as category_name,
    s.created_at
  from public.services s
  left join public.service_categories sc on sc.id = s.category_id
  where public.is_admin()
  order by s.name asc;
$$;

grant execute on function public.admin_list_services() to authenticated;

-- ─── admin_create_service — add p_category_id ────────────────────────────────
-- Parameter list changes: drop old signature first.

drop function if exists public.admin_create_service(text, integer, integer, text, integer, text);

create or replace function public.admin_create_service(
  p_name                    text,
  p_duration_minutes        integer,
  p_price_cents             integer,
  p_image_url               text    default null,
  p_max_concurrent_bookings integer default null,
  p_description             text    default null,
  p_category_id             uuid    default null
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
  category_id             uuid,
  category_name           text,
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
    description,
    category_id
  )
  values (
    v_org_id,
    p_name,
    p_duration_minutes,
    p_price_cents,
    p_image_url,
    p_max_concurrent_bookings,
    p_description,
    p_category_id
  )
  returning services.id into v_service_id;

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
      s.category_id,
      sc.name as category_name,
      s.created_at
    from public.services s
    left join public.service_categories sc on sc.id = s.category_id
    where s.id = v_service_id;
end;
$$;

grant execute on function public.admin_create_service(text, integer, integer, text, integer, text, uuid) to authenticated;

-- ─── admin_update_service — add p_category_id ────────────────────────────────
-- Parameter list changes: drop old signature first.

drop function if exists public.admin_update_service(uuid, text, integer, integer, text, integer, text);

create or replace function public.admin_update_service(
  p_service_id              uuid,
  p_name                    text,
  p_duration_minutes        integer,
  p_price_cents             integer,
  p_image_url               text    default null,
  p_max_concurrent_bookings integer default null,
  p_description             text    default null,
  p_category_id             uuid    default null
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
  category_id             uuid,
  category_name           text,
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
    category_id             = p_category_id,
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
      s.category_id,
      sc.name as category_name,
      s.created_at
    from public.services s
    left join public.service_categories sc on sc.id = s.category_id
    where s.id = p_service_id;
end;
$$;

grant execute on function public.admin_update_service(uuid, text, integer, integer, text, integer, text, uuid) to authenticated;

-- ─── list_services — public, includes category_id and category_name ──────────

create or replace function public.list_services()
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
  category_id             uuid,
  category_name           text,
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
    s.category_id,
    sc.name as category_name,
    s.created_at
  from public.services s
  left join public.service_categories sc on sc.id = s.category_id
  where s.is_active = true
  order by s.name asc;
$$;

grant execute on function public.list_services() to anon;
grant execute on function public.list_services() to authenticated;
