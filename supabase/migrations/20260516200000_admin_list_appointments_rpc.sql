-- Admin RPC: list all appointments with filters, pagination, and joined display fields
create or replace function public.admin_list_appointments(
  p_statuses text[],
  p_date_from timestamptz,
  p_date_to timestamptz,
  p_page integer,
  p_page_size integer
) returns table(
  id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  status text,
  service_name text,
  staff_display_name text,
  customer_name text,
  created_at timestamptz,
  total_count bigint
)
language plpgsql security definer set search_path = public as $$
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
      s.name            as service_name,
      sm.display_name   as staff_display_name,
      coalesce(pr.full_name, au.email, '—') as customer_name,
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
    order by a.starts_at desc
    limit  v_limit
    offset v_offset;
end;
$$;

grant execute on function public.admin_list_appointments(text[], timestamptz, timestamptz, integer, integer) to authenticated;
