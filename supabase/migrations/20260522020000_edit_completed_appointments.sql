-- "Completado" no bloquea el turno: aunque la hora ya pasó, admin y staff pueden editarlo,
-- cancelarlo o reprogramarlo (por ejemplo si la clienta no vino). Los clientes siguen sin poder.
--  * admin_update_appointment: acepta turnos completados.
--  * cancel_appointment / reschedule_appointment: aceptan completados si quien llama es admin o staff.
--  * reschedule: un turno completado que se mueve al futuro vuelve a quedar confirmado.

CREATE OR REPLACE FUNCTION public.admin_update_appointment(p_appointment_id uuid, p_service_id uuid, p_staff_member_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, service_id uuid, staff_member_id uuid, starts_at timestamp with time zone, ends_at timestamp with time zone, status text, notes text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_apt      public.appointments%rowtype;
  v_service  public.services%rowtype;
  v_staff    public.staff_members%rowtype;
  v_notes    text;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden editar turnos.'
      using errcode = 'P0001';
  end if;

  select * into v_apt from public.appointments a where a.id = p_appointment_id for update;
  if not found then
    raise exception 'APPOINTMENT_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Admin can also edit a completed appointment (the time passing is not a reason to lock it)
  if v_apt.status not in ('pending', 'confirmed', 'completed') then
    raise exception 'APPOINTMENT_NOT_EDITABLE' using errcode = 'P0001';
  end if;

  select * into v_service from public.services s
  where s.id = p_service_id and s.organization_id = v_apt.organization_id and s.is_active = true;
  if not found then
    raise exception 'SERVICE_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  select * into v_staff from public.staff_members sm
  where sm.id = p_staff_member_id and sm.organization_id = v_apt.organization_id and sm.is_active = true;
  if not found then
    raise exception 'STAFF_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.staff_services ss
    where ss.staff_member_id = p_staff_member_id and ss.service_id = p_service_id
  ) then
    raise exception 'STAFF_NOT_ASSIGNED_TO_SERVICE' using errcode = 'P0001';
  end if;

  v_notes := nullif(btrim(coalesce(p_notes, '')), '');
  if v_notes is not null and length(v_notes) > 500 then
    raise exception 'NOTES_TOO_LONG' using errcode = 'P0001';
  end if;

  begin
    update public.appointments a
    set service_id      = p_service_id,
        staff_member_id = p_staff_member_id,
        ends_at         = v_apt.starts_at + (v_service.duration_minutes || ' minutes')::interval,
        notes           = v_notes,
        updated_at      = now()
    where a.id = p_appointment_id;
  exception when exclusion_violation then
    raise exception 'APPOINTMENT_CONFLICT' using errcode = 'P0001';
  end;

  return query
  select a.id, a.service_id, a.staff_member_id, a.starts_at, a.ends_at, a.status, a.notes
  from public.appointments a
  where a.id = p_appointment_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.cancel_appointment(p_appointment_id uuid)
 RETURNS TABLE(id uuid, service_id uuid, staff_member_id uuid, starts_at timestamp with time zone, ends_at timestamp with time zone, status text, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- Admin and staff can also cancel a completed appointment; customers cannot
  if v_apt.status not in ('pending', 'confirmed')
     and not (v_apt.status = 'completed' and (v_is_admin or v_is_staff)) then
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
$function$
;

CREATE OR REPLACE FUNCTION public.reschedule_appointment(p_appointment_id uuid, p_new_starts_at timestamp with time zone)
 RETURNS TABLE(id uuid, service_id uuid, staff_member_id uuid, starts_at timestamp with time zone, ends_at timestamp with time zone, status text, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  -- Admin and staff can also reschedule a completed appointment; customers cannot
  if v_apt.status not in ('pending', 'confirmed')
     and not (v_apt.status = 'completed' and (v_is_admin or v_is_staff)) then
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
      -- a completed appointment moved to the future is pending again
      status     = case when a.status = 'completed' and p_new_starts_at > now() then 'confirmed' else a.status end,
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
$function$
;
