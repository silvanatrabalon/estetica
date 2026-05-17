-- cancel_appointment: SECURITY DEFINER RPC for cancelling an existing appointment.
-- Authorization:
--   - customer: may cancel only their own appointment (subject to policy window)
--   - staff: may cancel appointments they are assigned to (bypasses policy window)
--   - admin: may cancel any appointment (bypasses policy window)
-- Status guard: only 'pending' or 'confirmed' appointments may be cancelled.
-- TODO(#27): trigger cancellation notification

create or replace function public.cancel_appointment(
  p_appointment_id uuid
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
  v_is_admin    boolean;
  v_is_staff    boolean;
  v_is_customer boolean;
begin
  -- Fetch the appointment row
  select * into v_apt
  from public.appointments a
  where a.id = p_appointment_id;

  if not found then
    raise exception 'CANCEL_NOT_AUTHORIZED';
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
    raise exception 'CANCEL_NOT_AUTHORIZED';
  end if;

  -- Status guard: only pending or confirmed may be cancelled
  if v_apt.status not in ('pending', 'confirmed') then
    raise exception 'CANCEL_INVALID_STATUS';
  end if;

  -- Policy window check for customers only
  if v_is_customer then
    select * into v_org from public.organizations limit 1;
    if v_apt.starts_at < (now() + (v_org.booking_min_notice_minutes || ' minutes')::interval) then
      raise exception 'CANCEL_OUTSIDE_POLICY_WINDOW';
    end if;
  end if;

  -- Atomic UPDATE
  update public.appointments a
  set status     = 'cancelled',
      updated_at = now()
  where a.id = p_appointment_id;

  -- TODO(#27): trigger cancellation notification

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

grant execute on function public.cancel_appointment(uuid) to authenticated;
