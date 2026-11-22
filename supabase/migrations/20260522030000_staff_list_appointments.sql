-- Turnos del staff: la misma lista que ve el admin (períodos, estado, buscador de cliente y orden),
-- pero solo con los turnos de quien llama. Si la cuenta no tiene ficha de profesional se rechaza.

CREATE OR REPLACE FUNCTION public.staff_list_appointments(p_statuses text[], p_date_from timestamp with time zone, p_date_to timestamp with time zone, p_page integer, p_page_size integer, p_search text DEFAULT NULL::text, p_ascending boolean DEFAULT false)
 RETURNS TABLE(id uuid, starts_at timestamp with time zone, ends_at timestamp with time zone, status text, service_id uuid, service_name text, staff_display_name text, customer_name text, created_at timestamp with time zone, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_me     uuid;
  v_limit  int := coalesce(p_page_size, 50);
  v_offset int := (coalesce(p_page, 1) - 1) * coalesce(p_page_size, 50);
  -- Search text without accents or case, with the LIKE wildcards of the user escaped
  v_pat    text := case
                     when nullif(btrim(coalesce(p_search, '')), '') is null then null
                     else '%' || translate(lower(regexp_replace(btrim(p_search), '([\\%_])', '\\\1', 'g')),
                                           'áéíóúü', 'aeiouu') || '%'
                   end;
begin
  select sm.id into v_me from public.staff_members sm where sm.profile_user_id = auth.uid() limit 1;
  if v_me is null then
    raise exception 'STAFF_NOT_AUTHORIZED';
  end if;

  return query
    select
      a.id,
      a.starts_at,
      a.ends_at,
      a.status::text,
      a.service_id,
      s.name            as service_name,
      sm.display_name   as staff_display_name,
      coalesce(pr.full_name, a.guest_name, au.email, '—') as customer_name,
      a.created_at,
      count(*) over()   as total_count
    from public.appointments a
    join public.services s          on s.id  = a.service_id
    join public.staff_members sm    on sm.id = a.staff_member_id
    left join public.profiles pr    on pr.user_id = a.customer_user_id
    left join auth.users au         on au.id      = a.customer_user_id
    where
      (p_statuses  is null or a.status::text = any(p_statuses))
      and (p_date_from is null or a.starts_at >= p_date_from)
      and (p_date_to   is null or a.starts_at <= p_date_to)
      and a.staff_member_id = v_me
      and (
        v_pat is null
        or translate(lower(concat_ws(' ', pr.full_name, a.guest_name, au.email, a.guest_email, a.guest_phone, pr.phone)),
                     'áéíóúü', 'aeiouu') like v_pat
      )
    order by case when p_ascending then a.starts_at end asc, a.starts_at desc
    limit  v_limit
    offset v_offset;
end;
$function$
;

revoke all on function public.staff_list_appointments(text[], timestamptz, timestamptz, integer, integer, text, boolean) from public, anon;
grant execute on function public.staff_list_appointments(text[], timestamptz, timestamptz, integer, integer, text, boolean) to authenticated;
