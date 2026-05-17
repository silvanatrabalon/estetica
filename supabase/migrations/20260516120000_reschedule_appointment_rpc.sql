-- reschedule_appointment: SECURITY DEFINER RPC for rescheduling an existing appointment.
-- Authorization:
--   - customer: may reschedule only their own appointment (subject to policy window)
--   - staff: may reschedule appointments they are assigned to (bypasses policy window)
--   - admin: may reschedule any appointment (bypasses policy window)
-- Status guard: only 'pending' or 'confirmed' appointments may be rescheduled.
-- Conflict detection: delegated to the excl_appointments_staff_no_overlap GIST constraint.
-- ends_at is computed server-side from the service's duration_minutes.
-- TODO(#27): trigger reschedule notification

create or replace function public.reschedule_appointment(
  p_appointment_id uuid,
  p_new_starts_at  timestamptz
)
returns table(
  id              uuid,
  service_id      uuid,
  staff_member_id uuid,
  starts_at       timestamptz,
  ends_at         timestamptz,
  status          text,
  updated_at      timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_apt         public.appointments%rowtype;
  v_org         public.organizations%rowtype;
  v_duration    integer;
  v_new_ends_at timestamptz;
  v_is_admin    boolean;
  v_is_staff    boolean;
  v_is_customer boolean;
begin
  -- Fetch the appointment row
  select * into v_apt
  from public.appointments a
  where a.id = p_appointment_id;

  if not found then
    raise exception 'RESCHEDULE_NOT_AUTHORIZED';
  end if;

  -- Determine caller role using helper functions
  v_is_admin    := public.is_admin();
  v_is_staff    := (not v_is_admin) and exists (
    select 1 from public.staff_members sm
    where sm.id = v_apt.staff_member_id
      and sm.profile_user_id = auth.uid()
  );
  v_is_customer := (not v_is_admin) and (not v_is_staff)
    and (v_apt.customer_user_id = auth.uid());

  if not (v_is_admin or v_is_staff or v_is_customer) then
    raise exception 'RESCHEDULE_NOT_AUTHORIZED';
  end if;

  -- Status guard: only pending or confirmed may be rescheduled
  if v_apt.status not in ('pending', 'confirmed') then
    raise exception 'RESCHEDULE_INVALID_STATUS';
  end if;

  -- Policy window check for customers only
  if v_is_customer then
    select * into v_org from public.organizations limit 1;
    if p_new_starts_at < (now() + (v_org.booking_min_notice_minutes || ' minutes')::interval) then
      raise exception 'RESCHEDULE_OUTSIDE_POLICY_WINDOW';
    end if;
  end if;

  -- Compute ends_at server-side from service duration
  select s.duration_minutes into v_duration
  from public.services s
  where s.id = v_apt.service_id;

  v_new_ends_at := p_new_starts_at + (v_duration || ' minutes')::interval;

  -- Atomic UPDATE; excl_appointments_staff_no_overlap constraint handles conflict
  update public.appointments a
  set starts_at  = p_new_starts_at,
      ends_at    = v_new_ends_at,
      updated_at = now()
  where a.id = p_appointment_id;

  -- Return the updated row
  return query
    select
      a.id,
      a.service_id,
      a.staff_member_id,
      a.starts_at,
      a.ends_at,
      a.status,
      a.updated_at
    from public.appointments a
    where a.id = p_appointment_id;
end;
$$;

grant execute on function public.reschedule_appointment(uuid, timestamptz) to authenticated;
