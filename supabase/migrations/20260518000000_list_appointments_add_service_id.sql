-- Add service_id to list_appointments RPC output so clients can use it
-- for reschedule slot-picker (WeeklyCalendar DnD flow).

-- DROP first because PostgreSQL cannot change a function's return type with CREATE OR REPLACE.
drop function if exists public.list_appointments();

create or replace function public.list_appointments()
returns table(
  id                       uuid,
  starts_at                timestamptz,
  ends_at                  timestamptz,
  status                   text,
  created_at               timestamptz,
  customer_user_id         uuid,
  service_id               uuid,
  service_name             text,
  service_duration_minutes integer,
  service_price_cents      integer,
  staff_display_name       text,
  org_name                 text,
  org_timezone             text,
  customer_name            text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      a.id,
      a.starts_at,
      a.ends_at,
      a.status,
      a.created_at,
      a.customer_user_id,
      a.service_id,
      s.name             as service_name,
      s.duration_minutes as service_duration_minutes,
      s.price_cents      as service_price_cents,
      sm.display_name    as staff_display_name,
      o.name             as org_name,
      o.timezone         as org_timezone,
      p.full_name        as customer_name
    from public.appointments  a
    join public.services      s  on s.id  = a.service_id
    join public.staff_members sm on sm.id = a.staff_member_id
    join public.organizations o  on o.id  = a.organization_id
    left join public.profiles p  on p.user_id = a.customer_user_id
    where (
      -- Customer: own appointments only
      (not is_staff_or_admin() and a.customer_user_id = auth.uid())
      -- Staff: assigned appointments only (not admin)
      or (is_staff_or_admin() and not is_admin() and sm.profile_user_id = auth.uid())
      -- Admin: all org appointments
      or is_admin()
    )
    order by a.starts_at desc
    limit 200;
end;
$$;

grant execute on function public.list_appointments() to authenticated;

-- Also add service_id to admin_list_appointments RPC for the admin calendar DnD flow.
-- DROP first because the return type changes (adding service_id column).
drop function if exists public.admin_list_appointments(text[], timestamptz, timestamptz, integer, integer);

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
  service_id uuid,
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
      a.service_id,
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
