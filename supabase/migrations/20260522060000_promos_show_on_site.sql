-- Promos: the admin chooses which promos are shown on the public website.
--
-- A promo always applies by itself when booking (and is seen in the booking screen); what is
-- selectable is whether it also shows in the "Promociones" section of the website, like coupons.

alter table public.promos add column if not exists show_on_site boolean not null default false;

drop function if exists public.admin_list_promos();
drop function if exists public.admin_upsert_promo(uuid, text, text, text, integer, date, date, boolean, uuid[]);

create or replace function public.admin_list_promos()
returns table (
  id              uuid,
  name            text,
  description     text,
  discount_type   text,
  discount_value  integer,
  starts_on       date,
  ends_on         date,
  is_active       boolean,
  show_on_site    boolean,
  service_ids     uuid[],
  service_names   text[],
  times_used      bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden ver las promos.' using errcode = 'P0001';
  end if;

  return query
  select
    p.id, p.name, p.description, p.discount_type, p.discount_value, p.starts_on, p.ends_on, p.is_active, p.show_on_site,
    coalesce((select array_agg(ps.service_id order by s.name) from public.promo_services ps
                join public.services s on s.id = ps.service_id where ps.promo_id = p.id), '{}'::uuid[]),
    coalesce((select array_agg(s.name::text order by s.name) from public.promo_services ps
                join public.services s on s.id = ps.service_id where ps.promo_id = p.id), '{}'::text[]),
    (select count(*) from public.appointments a where a.promo_id = p.id and a.status <> 'cancelled')
  from public.promos p
  order by p.is_active desc, p.ends_on desc, p.created_at desc;
end;
$$;

create or replace function public.admin_upsert_promo(
  p_id             uuid,
  p_name           text,
  p_description    text,
  p_discount_type  text,
  p_discount_value integer,
  p_starts_on      date,
  p_ends_on        date,
  p_is_active      boolean,
  p_service_ids    uuid[],
  p_show_on_site   boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org     uuid;
  v_id      uuid := p_id;
  v_name    text := btrim(coalesce(p_name, ''));
  v_ids     uuid[] := (select coalesce(array_agg(distinct x), '{}'::uuid[]) from unnest(coalesce(p_service_ids, '{}'::uuid[])) x);
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden guardar promos.' using errcode = 'P0001';
  end if;

  if length(v_name) < 2 or length(v_name) > 60 then
    raise exception 'PROMO_NAME_INVALID' using errcode = 'P0001';
  end if;
  if p_discount_type not in ('percent', 'fixed') or p_discount_value is null or p_discount_value <= 0
     or (p_discount_type = 'percent' and p_discount_value > 100) then
    raise exception 'PROMO_DISCOUNT_INVALID' using errcode = 'P0001';
  end if;
  if p_starts_on is null or p_ends_on is null or p_starts_on > p_ends_on then
    raise exception 'PROMO_DATES_INVALID' using errcode = 'P0001';
  end if;
  if array_length(v_ids, 1) is null then
    raise exception 'PROMO_NO_SERVICES' using errcode = 'P0001';
  end if;

  select o.id into v_org from public.organizations o order by o.created_at limit 1;
  if exists (select 1 from unnest(v_ids) x where not exists (select 1 from public.services s where s.id = x and s.organization_id = v_org)) then
    raise exception 'PROMO_SERVICE_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_id is null then
    insert into public.promos (organization_id, name, description, discount_type, discount_value, starts_on, ends_on, is_active, show_on_site)
    values (v_org, v_name, nullif(btrim(coalesce(p_description, '')), ''), p_discount_type, p_discount_value, p_starts_on, p_ends_on, coalesce(p_is_active, true), coalesce(p_show_on_site, false))
    returning promos.id into v_id;
  else
    update public.promos
       set name = v_name,
           description = nullif(btrim(coalesce(p_description, '')), ''),
           discount_type = p_discount_type,
           discount_value = p_discount_value,
           starts_on = p_starts_on,
           ends_on = p_ends_on,
           is_active = coalesce(p_is_active, true),
           show_on_site = coalesce(p_show_on_site, false),
           updated_at = now()
     where promos.id = v_id and promos.organization_id = v_org;
    if not found then
      raise exception 'PROMO_NOT_FOUND' using errcode = 'P0001';
    end if;
  end if;

  delete from public.promo_services where promo_id = v_id and service_id <> all (v_ids);
  insert into public.promo_services (promo_id, service_id)
  select v_id, x from unnest(v_ids) x
  on conflict do nothing;

  return v_id;
end;
$$;


-- The promos valid today that the admin chose to show on the website (also for visitors)
create or replace function public.list_public_promos()
returns table (
  promo_id       uuid,
  name           text,
  description    text,
  discount_type  text,
  discount_value integer,
  ends_on        date,
  service_names  text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name::text, p.description, p.discount_type::text, p.discount_value, p.ends_on,
         coalesce((select array_agg(s.name::text order by s.name)
                     from public.promo_services ps
                     join public.services s on s.id = ps.service_id and s.is_active = true
                    where ps.promo_id = p.id), '{}'::text[])
    from public.promos p
    join public.organizations o on o.id = p.organization_id
   where p.is_active = true
     and p.show_on_site = true
     and (now() at time zone coalesce(o.timezone, 'UTC'))::date between p.starts_on and p.ends_on
     and exists (select 1 from public.promo_services ps
                   join public.services s on s.id = ps.service_id and s.is_active = true
                  where ps.promo_id = p.id)
   order by p.ends_on asc, p.created_at desc;
$$;

revoke all on function public.admin_list_promos() from public, anon;
revoke all on function public.admin_upsert_promo(uuid, text, text, text, integer, date, date, boolean, uuid[], boolean) from public, anon;
revoke all on function public.list_public_promos() from public;
grant execute on function public.admin_list_promos() to authenticated;
grant execute on function public.admin_upsert_promo(uuid, text, text, text, integer, date, date, boolean, uuid[], boolean) to authenticated;
grant execute on function public.list_public_promos() to anon, authenticated;
