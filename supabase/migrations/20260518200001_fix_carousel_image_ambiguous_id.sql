-- Fix ambiguous column reference "id" in admin_add_carousel_image.
-- The INSERT's RETURNING clause conflicts with the function's RETURNS TABLE column named "id".
-- Fix: qualify the column as "landing_carousel_images.id" in the RETURNING clause.

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

  select organizations.id into v_org_id from public.organizations limit 1;

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
  returning landing_carousel_images.id into v_image_id;

  return query
  select lci.id, lci.organization_id, lci.storage_path, lci.display_order, lci.alt_text, lci.created_at
  from public.landing_carousel_images lci
  where lci.id = v_image_id;
end;
$$;

revoke all on function public.admin_add_carousel_image(text, text) from public;
grant execute on function public.admin_add_carousel_image(text, text) to authenticated;
