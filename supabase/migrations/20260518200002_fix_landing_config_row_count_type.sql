-- Fix "operator does not exist: boolean = integer" in get_landing_config
-- and admin_get_landing_config.
-- Root cause: v_found was declared as boolean but GET DIAGNOSTICS ROW_COUNT
-- returns bigint, and the subsequent "if v_found = 0" compares boolean = integer.
-- Fix: declare v_found as bigint.

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
  v_found bigint := 0;
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
  v_found bigint := 0;
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
