-- Public Business Landing Page
-- Creates landing_config and landing_carousel_images tables, all RPCs,
-- Supabase Storage bucket setup, and anon grants for public landing reads.

-- ──────────────────────────────────────────────────────────────────────────────
-- Storage: media bucket (public read, admin write)
-- ──────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Anon + authenticated can read any object in the media bucket
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'media');

-- Only admins can upload
drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can update
drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'media'
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can delete
drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'media'
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- Tables
-- ──────────────────────────────────────────────────────────────────────────────

create table if not exists public.landing_config (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  hero_title       text,
  hero_subtitle    text,
  about_text       text,
  instagram_url    text,
  whatsapp_number  text,
  primary_color    text not null default '#f9a8d4',
  secondary_color  text not null default '#fbcfe8',
  font_family      text not null default 'Inter',
  show_hours       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id)
);

create table if not exists public.landing_carousel_images (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  storage_path     text not null,
  display_order    integer not null default 0,
  alt_text         text,
  created_at       timestamptz not null default now()
);

create index if not exists idx_landing_carousel_images_org_order
  on public.landing_carousel_images (organization_id, display_order);

alter table public.landing_config enable row level security;
alter table public.landing_carousel_images enable row level security;

-- No direct DML from clients; all writes go through SECURITY DEFINER RPCs.
-- Grant SELECT to anon (for public landing page) and authenticated.
grant select on table public.landing_config to anon, authenticated;
grant select on table public.landing_carousel_images to anon, authenticated;

drop policy if exists "landing_config_select_public" on public.landing_config;
create policy "landing_config_select_public"
  on public.landing_config
  for select
  to anon, authenticated
  using (true);

drop policy if exists "landing_carousel_images_select_public" on public.landing_carousel_images;
create policy "landing_carousel_images_select_public"
  on public.landing_carousel_images
  for select
  to anon, authenticated
  using (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- Anon grants for public landing reads
-- (services, business_hours, organizations)
-- ──────────────────────────────────────────────────────────────────────────────

grant select on table public.services to anon;
grant select on table public.business_hours to anon;
grant select on table public.organizations to anon;

drop policy if exists "services_select_anon" on public.services;
create policy "services_select_anon"
  on public.services
  for select
  to anon
  using (true);

drop policy if exists "business_hours_select_anon" on public.business_hours;
create policy "business_hours_select_anon"
  on public.business_hours
  for select
  to anon
  using (true);

drop policy if exists "organizations_select_anon" on public.organizations;
create policy "organizations_select_anon"
  on public.organizations
  for select
  to anon
  using (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- get_landing_config()
-- Public function returning landing config + carousel images as jsonb array.
-- Granted to anon and authenticated.
-- Returns a row with all-null fields (except color/font defaults) when no config.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.get_landing_config()
returns table (
  id                uuid,
  organization_id   uuid,
  hero_title        text,
  hero_subtitle     text,
  about_text        text,
  instagram_url     text,
  whatsapp_number   text,
  primary_color     text,
  secondary_color   text,
  font_family       text,
  show_hours        boolean,
  carousel_images   jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_found boolean := false;
begin
  return query
  select
    lc.id,
    lc.organization_id,
    lc.hero_title,
    lc.hero_subtitle,
    lc.about_text,
    lc.instagram_url,
    lc.whatsapp_number,
    lc.primary_color,
    lc.secondary_color,
    lc.font_family,
    lc.show_hours,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ci.id,
            'organization_id', ci.organization_id,
            'storage_path', ci.storage_path,
            'display_order', ci.display_order,
            'alt_text', ci.alt_text,
            'created_at', ci.created_at
          ) order by ci.display_order asc
        )
        from public.landing_carousel_images ci
        where ci.organization_id = lc.organization_id
      ),
      '[]'::jsonb
    ) as carousel_images
  from public.landing_config lc
  limit 1;

  get diagnostics v_found = row_count;

  if v_found = 0 then
    return query
    select
      null::uuid,
      null::uuid,
      null::text,
      null::text,
      null::text,
      null::text,
      null::text,
      '#f9a8d4'::text,
      '#fbcfe8'::text,
      'Inter'::text,
      true::boolean,
      '[]'::jsonb;
  end if;
end;
$$;

revoke all on function public.get_landing_config() from public;
grant execute on function public.get_landing_config() to anon, authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_get_landing_config()
-- Admin-only: returns full landing config + carousel images.
-- Raises LANDING_NOT_AUTHORIZED for non-admin callers.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_get_landing_config()
returns table (
  id                uuid,
  organization_id   uuid,
  hero_title        text,
  hero_subtitle     text,
  about_text        text,
  instagram_url     text,
  whatsapp_number   text,
  primary_color     text,
  secondary_color   text,
  font_family       text,
  show_hours        boolean,
  carousel_images   jsonb
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_found boolean := false;
begin
  if not public.is_admin() then
    raise exception 'LANDING_NOT_AUTHORIZED';
  end if;

  return query
  select
    lc.id,
    lc.organization_id,
    lc.hero_title,
    lc.hero_subtitle,
    lc.about_text,
    lc.instagram_url,
    lc.whatsapp_number,
    lc.primary_color,
    lc.secondary_color,
    lc.font_family,
    lc.show_hours,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', ci.id,
            'organization_id', ci.organization_id,
            'storage_path', ci.storage_path,
            'display_order', ci.display_order,
            'alt_text', ci.alt_text,
            'created_at', ci.created_at
          ) order by ci.display_order asc
        )
        from public.landing_carousel_images ci
        where ci.organization_id = lc.organization_id
      ),
      '[]'::jsonb
    ) as carousel_images
  from public.landing_config lc
  limit 1;

  get diagnostics v_found = row_count;

  if v_found = 0 then
    return query
    select
      null::uuid,
      null::uuid,
      null::text,
      null::text,
      null::text,
      null::text,
      null::text,
      '#f9a8d4'::text,
      '#fbcfe8'::text,
      'Inter'::text,
      true::boolean,
      '[]'::jsonb;
  end if;
end;
$$;

revoke all on function public.admin_get_landing_config() from public;
grant execute on function public.admin_get_landing_config() to authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_upsert_landing_config(...)
-- Admin-only: insert or update the landing config row for the organization.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_upsert_landing_config(
  p_hero_title       text    default null,
  p_hero_subtitle    text    default null,
  p_about_text       text    default null,
  p_instagram_url    text    default null,
  p_whatsapp_number  text    default null,
  p_primary_color    text    default '#f9a8d4',
  p_secondary_color  text    default '#fbcfe8',
  p_font_family      text    default 'Inter',
  p_show_hours       boolean default true
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
    raise exception 'LANDING_NOT_AUTHORIZED';
  end if;

  select id into v_org_id from public.organizations limit 1;

  if v_org_id is null then
    raise exception 'No se encontró la organización.';
  end if;

  insert into public.landing_config (
    organization_id, hero_title, hero_subtitle, about_text,
    instagram_url, whatsapp_number, primary_color, secondary_color,
    font_family, show_hours, updated_at
  )
  values (
    v_org_id, p_hero_title, p_hero_subtitle, p_about_text,
    p_instagram_url, p_whatsapp_number, p_primary_color, p_secondary_color,
    p_font_family, p_show_hours, now()
  )
  on conflict (organization_id) do update set
    hero_title      = excluded.hero_title,
    hero_subtitle   = excluded.hero_subtitle,
    about_text      = excluded.about_text,
    instagram_url   = excluded.instagram_url,
    whatsapp_number = excluded.whatsapp_number,
    primary_color   = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    font_family     = excluded.font_family,
    show_hours      = excluded.show_hours,
    updated_at      = now();
end;
$$;

revoke all on function public.admin_upsert_landing_config(text,text,text,text,text,text,text,text,boolean) from public;
grant execute on function public.admin_upsert_landing_config(text,text,text,text,text,text,text,text,boolean) to authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_add_carousel_image(p_storage_path, p_alt_text)
-- Admin-only: insert a carousel image row, auto-assigning next display_order.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_add_carousel_image(
  p_storage_path text,
  p_alt_text     text default null
)
returns table (
  id              uuid,
  organization_id uuid,
  storage_path    text,
  display_order   integer,
  alt_text        text,
  created_at      timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id       uuid;
  v_next_order   integer;
  v_image_id     uuid;
begin
  if not public.is_admin() then
    raise exception 'LANDING_NOT_AUTHORIZED';
  end if;

  select id into v_org_id from public.organizations limit 1;

  if v_org_id is null then
    raise exception 'No se encontró la organización.';
  end if;

  select coalesce(max(lci.display_order) + 1, 0)
  into v_next_order
  from public.landing_carousel_images lci
  where lci.organization_id = v_org_id;

  insert into public.landing_carousel_images (
    organization_id, storage_path, display_order, alt_text
  )
  values (v_org_id, p_storage_path, v_next_order, p_alt_text)
  returning id into v_image_id;

  return query
  select lci.id, lci.organization_id, lci.storage_path, lci.display_order, lci.alt_text, lci.created_at
  from public.landing_carousel_images lci
  where lci.id = v_image_id;
end;
$$;

revoke all on function public.admin_add_carousel_image(text, text) from public;
grant execute on function public.admin_add_carousel_image(text, text) to authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_remove_carousel_image(p_image_id)
-- Admin-only: delete a carousel image row.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_remove_carousel_image(
  p_image_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'LANDING_NOT_AUTHORIZED';
  end if;

  delete from public.landing_carousel_images
  where id = p_image_id;
end;
$$;

revoke all on function public.admin_remove_carousel_image(uuid) from public;
grant execute on function public.admin_remove_carousel_image(uuid) to authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_reorder_carousel_images(p_ordered_ids)
-- Admin-only: update display_order for all images atomically.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_reorder_carousel_images(
  p_ordered_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  i integer;
begin
  if not public.is_admin() then
    raise exception 'LANDING_NOT_AUTHORIZED';
  end if;

  for i in 1..coalesce(array_length(p_ordered_ids, 1), 0) loop
    update public.landing_carousel_images
    set display_order = i - 1
    where id = p_ordered_ids[i];
  end loop;
end;
$$;

revoke all on function public.admin_reorder_carousel_images(uuid[]) from public;
grant execute on function public.admin_reorder_carousel_images(uuid[]) to authenticated;
