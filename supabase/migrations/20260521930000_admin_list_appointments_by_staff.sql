-- Filter the admin appointments list by professional.
-- Adds an optional p_staff_member_id (null = everyone). The old 5-argument version is dropped so
-- calls by name stay unambiguous.

drop function if exists public.admin_list_appointments(text[], timestamptz, timestamptz, integer, integer);

CREATE OR REPLACE FUNCTION public.admin_list_appointments(p_statuses text[], p_date_from timestamp with time zone, p_date_to timestamp with time zone, p_page integer, p_page_size integer, p_staff_member_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, starts_at timestamp with time zone, ends_at timestamp with time zone, status text, service_id uuid, service_name text, staff_display_name text, customer_name text, created_at timestamp with time zone, total_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_limit  int := coalesce(p_page_size, 50);
  v_offset int := (coalesce(p_page, 1) - 1) * coalesce(p_page_size, 50);
begin
  if not is_admin() then
    raise exception 'ADMIN_NOT_AUTHORIZED';
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
      and (p_staff_member_id is null or a.staff_member_id = p_staff_member_id)
    order by a.starts_at desc
    limit  v_limit
    offset v_offset;
end;
$function$
;

grant execute on function public.admin_list_appointments(text[], timestamptz, timestamptz, integer, integer, uuid) to authenticated;
