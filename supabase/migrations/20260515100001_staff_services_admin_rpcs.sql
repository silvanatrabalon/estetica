-- Admin SECURITY DEFINER RPC functions for staff–service assignment management.
-- All functions check is_admin() and raise an exception for unauthorized callers.
-- Follows the pattern established in services_admin_rpc and staff management RPCs.

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_list_staff_services
-- Returns service details for services currently assigned to a staff member.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_list_staff_services(
  p_staff_member_id uuid
)
returns table (
  service_id       uuid,
  name             text,
  duration_minutes integer,
  price_cents      integer,
  image_url        text,
  is_active        boolean,
  created_at       timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id        as service_id,
    s.name,
    s.duration_minutes,
    s.price_cents,
    s.image_url,
    s.is_active,
    s.created_at
  from public.staff_services ss
  join public.services s on s.id = ss.service_id
  where ss.staff_member_id = p_staff_member_id
    and public.is_admin()
  order by s.name asc;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_list_assignable_services
-- Returns active services NOT yet assigned to the given staff member.
-- Used to populate the assignment selector in the admin panel.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_list_assignable_services(
  p_staff_member_id uuid
)
returns table (
  service_id       uuid,
  name             text,
  duration_minutes integer,
  price_cents      integer,
  image_url        text,
  is_active        boolean,
  created_at       timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id        as service_id,
    s.name,
    s.duration_minutes,
    s.price_cents,
    s.image_url,
    s.is_active,
    s.created_at
  from public.services s
  where s.is_active = true
    and s.id not in (
      select ss.service_id
      from public.staff_services ss
      where ss.staff_member_id = p_staff_member_id
    )
    and public.is_admin()
  order by s.name asc;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_assign_service_to_staff
-- Inserts a junction row; populates organization_id from the staff member's org.
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_assign_service_to_staff(
  p_staff_member_id uuid,
  p_service_id      uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  insert into public.staff_services (staff_member_id, service_id, organization_id)
  select p_staff_member_id, p_service_id, sm.organization_id
  from public.staff_members sm
  where sm.id = p_staff_member_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- admin_unassign_service_from_staff
-- Hard-deletes the junction row (no soft-delete; unassignment is binary).
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.admin_unassign_service_from_staff(
  p_staff_member_id uuid,
  p_service_id      uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  delete from public.staff_services
  where staff_member_id = p_staff_member_id
    and service_id = p_service_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Grants
-- ──────────────────────────────────────────────────────────────────────────────

grant execute on function public.admin_list_staff_services(uuid)       to authenticated;
grant execute on function public.admin_list_assignable_services(uuid)  to authenticated;
grant execute on function public.admin_assign_service_to_staff(uuid, uuid)    to authenticated;
grant execute on function public.admin_unassign_service_from_staff(uuid, uuid) to authenticated;
