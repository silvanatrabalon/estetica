-- Social links shown on the public landing page.
-- One row per (organization, network). The admin picks which networks to show
-- (`enabled`) and sets the value (a URL, or a phone number for WhatsApp).

create table if not exists public.social_links (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  network         text not null
    check (network in ('instagram', 'whatsapp', 'facebook', 'tiktok', 'youtube', 'x', 'website')),
  value           text not null check (length(btrim(value)) > 0),
  enabled         boolean not null default true,
  updated_at      timestamptz not null default now(),
  primary key (organization_id, network)
);

alter table public.social_links enable row level security;

grant select on table public.social_links to anon, authenticated;
grant insert, update, delete on table public.social_links to authenticated;

-- Public visitors only see networks the admin chose to show; admins see everything.
drop policy if exists social_links_select_public on public.social_links;
create policy social_links_select_public
  on public.social_links
  for select
  to anon, authenticated
  using (enabled or public.is_admin());

drop policy if exists social_links_insert_admin on public.social_links;
create policy social_links_insert_admin
  on public.social_links
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists social_links_update_admin on public.social_links;
create policy social_links_update_admin
  on public.social_links
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists social_links_delete_admin on public.social_links;
create policy social_links_delete_admin
  on public.social_links
  for delete
  to authenticated
  using (public.is_admin());

-- Carry over the Instagram URL already configured in the landing page settings.
insert into public.social_links (organization_id, network, value, enabled)
select lc.organization_id, 'instagram', btrim(lc.instagram_url), true
from public.landing_config lc
where lc.instagram_url is not null and length(btrim(lc.instagram_url)) > 0
on conflict (organization_id, network) do nothing;
