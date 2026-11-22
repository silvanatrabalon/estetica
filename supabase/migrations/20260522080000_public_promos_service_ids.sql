-- The website links each promo to its booking: it needs the ids of the promo's services too.
drop function if exists public.list_public_promos();

create function public.list_public_promos()
returns table (
  promo_id       uuid,
  name           text,
  description    text,
  discount_type  text,
  discount_value integer,
  ends_on        date,
  service_names  text[],
  service_ids    uuid[]
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
                    where ps.promo_id = p.id), '{}'::text[]),
         coalesce((select array_agg(s.id order by s.name)
                     from public.promo_services ps
                     join public.services s on s.id = ps.service_id and s.is_active = true
                    where ps.promo_id = p.id), '{}'::uuid[])
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

revoke all on function public.list_public_promos() from public;
grant execute on function public.list_public_promos() to anon, authenticated;
