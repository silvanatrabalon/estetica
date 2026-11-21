-- Booking for someone else.
--
-- Admin and staff can book on behalf of a client: an existing client account, or a person
-- without an account (name, optional phone and email). The appointment belongs to the client,
-- never to the admin or staff who created it (created_by_user_id keeps who did it).
-- A client can still only book for themselves. Booking for oneself works as before.
--
--  * appointments get guest_name / guest_phone / guest_email for people without an account
--    (customer_user_id is already nullable);
--  * list_booking_clients lists the client accounts for the picker (admin and staff only);
--  * create_appointment takes the optional customer; coupons are only for client accounts;
--  * every read that shows the client's name falls back to the guest name.

alter table public.appointments
  add column if not exists guest_name  text,
  add column if not exists guest_phone text,
  add column if not exists guest_email text;

-- ── Client picker ──────────────────────────────────────────────────────────────

create or replace function public.list_booking_clients()
returns table (user_id uuid, name text, email text)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.is_staff_or_admin() then
    raise exception 'BOOKING_NOT_ALLOWED' using errcode = 'P0001';
  end if;

  return query
  select u.id,
         coalesce(nullif(btrim(p.full_name), ''), '')::text,
         u.email::text
    from auth.users u
    join public.user_roles ur on ur.user_id = u.id and ur.role = 'customer'
    left join public.profiles p on p.user_id = u.id
   where coalesce(ur.is_active, true)
   order by coalesce(nullif(btrim(p.full_name), ''), u.email);
end;
$$;

revoke all on function public.list_booking_clients() from public, anon;
grant execute on function public.list_booking_clients() to authenticated;

-- ── create_appointment with an optional customer ───────────────────────────────

drop function if exists public.create_appointment(uuid, timestamptz, text);

create or replace function public.create_appointment(
  p_service_id       uuid,
  p_starts_at        timestamptz,
  p_coupon_code      text default null,
  p_customer_user_id uuid default null,
  p_guest_name       text default null,
  p_guest_phone      text default null,
  p_guest_email      text default null
)
returns table (
  id              uuid,
  service_id      uuid,
  staff_member_id uuid,
  starts_at       timestamptz,
  ends_at         timestamptz,
  status          text,
  created_at      timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id           uuid;
  v_customer_id       uuid;
  v_on_behalf         boolean;
  v_guest_name        text := nullif(btrim(coalesce(p_guest_name, '')), '');
  v_guest_phone       text := nullif(btrim(coalesce(p_guest_phone, '')), '');
  v_guest_email       text := nullif(btrim(coalesce(p_guest_email, '')), '');
  v_org               record;
  v_service           record;
  v_ends_at           timestamptz;
  v_earliest_starts   timestamptz;
  v_latest_date       date;
  v_concurrent_count  integer;
  v_staff_id          uuid;
  v_appointment_id    uuid;
  v_tz                text;
  v_local_date        date;
  v_local_start       time;
  v_local_end         time;
  v_coupon_id         uuid;
  v_discount          integer := 0;
  v_final_price       integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'BOOKING_UNAUTHORIZED' using errcode = 'P0001';
  end if;

  -- Booking for someone else is only for admin and staff
  v_on_behalf := p_customer_user_id is not null or v_guest_name is not null;
  if v_on_behalf and not public.is_staff_or_admin() then
    raise exception 'BOOKING_NOT_ALLOWED' using errcode = 'P0001';
  end if;

  if p_customer_user_id is not null and v_guest_name is not null then
    raise exception 'BOOKING_CUSTOMER_INVALID' using errcode = 'P0001';
  end if;

  if p_customer_user_id is not null then
    if not exists (select 1 from auth.users u where u.id = p_customer_user_id) then
      raise exception 'BOOKING_CUSTOMER_INVALID' using errcode = 'P0001';
    end if;
    v_customer_id := p_customer_user_id;
  elsif v_guest_name is not null then
    -- A person without an account
    if length(v_guest_name) < 2 or length(v_guest_name) > 80
       or length(coalesce(v_guest_phone, '')) > 30
       or length(coalesce(v_guest_email, '')) > 120
       or (v_guest_email is not null and v_guest_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
      raise exception 'BOOKING_GUEST_INVALID' using errcode = 'P0001';
    end if;
    v_customer_id := null;
  else
    v_customer_id := v_user_id;
  end if;

  if v_customer_id is null and p_coupon_code is not null and btrim(p_coupon_code) <> '' then
    raise exception 'COUPON_NOT_FOR_GUEST' using errcode = 'P0001';
  end if;

  select org.* into v_org from public.organizations org limit 1;
  if not found then
    raise exception 'BOOKING_SERVICE_NOT_FOUND' using errcode = 'P0001';
  end if;

  select svc.* into v_service
    from public.services svc
   where svc.id = p_service_id and svc.is_active = true;
  if not found then
    raise exception 'BOOKING_SERVICE_NOT_FOUND' using errcode = 'P0001';
  end if;

  v_tz := coalesce(v_org.timezone, 'UTC');
  v_ends_at := p_starts_at + (v_service.duration_minutes * interval '1 minute');

  v_earliest_starts := now() + (coalesce(v_org.booking_min_notice_minutes, 60) * interval '1 minute');
  v_latest_date := (now() at time zone v_tz)::date + coalesce(v_org.booking_max_horizon_days, 60);

  if p_starts_at < v_earliest_starts then
    raise exception 'BOOKING_OUTSIDE_POLICY_WINDOW' using errcode = 'P0001';
  end if;

  if (p_starts_at at time zone v_tz)::date > v_latest_date then
    raise exception 'BOOKING_OUTSIDE_POLICY_WINDOW' using errcode = 'P0001';
  end if;

  v_local_date  := (p_starts_at at time zone v_tz)::date;
  v_local_start := (p_starts_at at time zone v_tz)::time;
  v_local_end   := (v_ends_at   at time zone v_tz)::time;

  if (v_ends_at at time zone v_tz)::date <> v_local_date
     or not exists (
       select 1 from public.business_open_windows(v_org.id, v_local_date) bw
        where bw.window_start <= v_local_start and bw.window_end >= v_local_end)
  then
    raise exception 'BOOKING_NO_STAFF_AVAILABLE' using errcode = 'P0001';
  end if;

  if v_service.max_concurrent_bookings is not null then
    select count(*) into v_concurrent_count
      from public.appointments a
     where a.service_id = p_service_id
       and a.status in ('pending', 'confirmed')
       and a.starts_at < v_ends_at
       and a.ends_at > p_starts_at;

    if v_concurrent_count >= v_service.max_concurrent_bookings then
      raise exception 'BOOKING_CAPACITY_EXCEEDED' using errcode = 'P0001';
    end if;
  end if;

  select sm.id into v_staff_id
    from public.staff_members sm
    join public.staff_services ss
      on ss.staff_member_id = sm.id and ss.service_id = p_service_id
   where sm.is_active = true
     and exists (
       select 1 from public.staff_working_windows(sm.id, v_local_date) sw
        where sw.window_start <= v_local_start and sw.window_end >= v_local_end)
     and not exists (
       select 1 from public.appointments a
        where a.staff_member_id = sm.id
          and a.status in ('pending', 'confirmed')
          and a.starts_at < v_ends_at
          and a.ends_at > p_starts_at)
   order by sm.created_at asc
   limit 1;

  if v_staff_id is null then
    raise exception 'BOOKING_NO_STAFF_AVAILABLE' using errcode = 'P0001';
  end if;

  v_final_price := v_service.price_cents;

  if p_coupon_code is not null and btrim(p_coupon_code) <> '' then
    select rc.coupon_id, rc.discount_cents, rc.final_price_cents
      into v_coupon_id, v_discount, v_final_price
      from public._resolve_coupon(p_service_id, p_coupon_code, v_customer_id) rc;
  end if;

  insert into public.appointments (
    organization_id, service_id, staff_member_id, customer_user_id,
    created_by_user_id, starts_at, ends_at, status,
    price_cents, original_price_cents, discount_cents, coupon_id,
    guest_name, guest_phone, guest_email
  )
  values (
    v_org.id, p_service_id, v_staff_id, v_customer_id,
    v_user_id, p_starts_at, v_ends_at, 'confirmed',
    v_final_price, v_service.price_cents, v_discount, v_coupon_id,
    v_guest_name, v_guest_phone, v_guest_email
  )
  returning appointments.id into v_appointment_id;

  if v_coupon_id is not null then
    insert into public.coupon_redemptions (coupon_id, customer_user_id, appointment_id, discount_cents)
    values (v_coupon_id, v_customer_id, v_appointment_id, v_discount);
  end if;

  return query
    select appt.id, appt.service_id, appt.staff_member_id, appt.starts_at,
           appt.ends_at, appt.status, appt.created_at
      from public.appointments appt
     where appt.id = v_appointment_id;
end;
$$;

revoke all on function public.create_appointment(uuid, timestamptz, text, uuid, text, text, text) from public, anon;
grant execute on function public.create_appointment(uuid, timestamptz, text, uuid, text, text, text) to authenticated;

-- ── Reads show the guest name when there is no account ────────────────────────

CREATE OR REPLACE FUNCTION public.list_appointments()
 RETURNS TABLE(id uuid, starts_at timestamp with time zone, ends_at timestamp with time zone, status text, created_at timestamp with time zone, customer_user_id uuid, service_id uuid, service_name text, service_duration_minutes integer, service_price_cents integer, staff_display_name text, org_name text, org_timezone text, customer_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      coalesce(p.full_name, a.guest_name) as customer_name
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
$function$;

CREATE OR REPLACE FUNCTION public.list_my_staff_appointments()
 RETURNS TABLE(id uuid, starts_at timestamp with time zone, ends_at timestamp with time zone, status text, created_at timestamp with time zone, customer_user_id uuid, service_id uuid, service_name text, service_duration_minutes integer, service_price_cents integer, staff_display_name text, org_name text, org_timezone text, customer_name text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      coalesce(p.full_name, a.guest_name) as customer_name
    from public.appointments  a
    join public.services      s  on s.id  = a.service_id
    join public.staff_members sm on sm.id = a.staff_member_id
    join public.organizations o  on o.id  = a.organization_id
    left join public.profiles p  on p.user_id = a.customer_user_id
    where sm.profile_user_id = auth.uid()
    order by a.starts_at desc
    limit 200;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_list_appointments(p_statuses text[], p_date_from timestamp with time zone, p_date_to timestamp with time zone, p_page integer, p_page_size integer)
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
    order by a.starts_at desc
    limit  v_limit
    offset v_offset;
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_appointment(p_appointment_id uuid)
 RETURNS TABLE(id uuid, service_id uuid, staff_member_id uuid, starts_at timestamp with time zone, ends_at timestamp with time zone, status text, notes text, created_at timestamp with time zone, customer_user_id uuid, customer_name text, customer_email text, customer_phone text, service_name text, service_duration_minutes integer, service_price_cents integer, staff_display_name text, org_timezone text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden ver el detalle de un turno.'
      using errcode = 'P0001';
  end if;

  return query
  select
    a.id,
    a.service_id,
    a.staff_member_id,
    a.starts_at,
    a.ends_at,
    a.status,
    a.notes,
    a.created_at,
    a.customer_user_id,
    coalesce(nullif(btrim(p.full_name), ''), a.guest_name, au.email, 'Cliente sin nombre')::text as customer_name,
    coalesce(au.email, a.guest_email)::text as customer_email,
    coalesce(p.phone, a.guest_phone)::text as customer_phone,
    s.name::text        as service_name,
    s.duration_minutes::integer as service_duration_minutes,
    coalesce(a.price_cents, s.price_cents)::integer as service_price_cents,
    sm.display_name::text       as staff_display_name,
    coalesce(o.timezone, 'UTC')::text as org_timezone
  from public.appointments a
  join public.services s       on s.id  = a.service_id
  join public.staff_members sm on sm.id = a.staff_member_id
  join public.organizations o  on o.id  = a.organization_id
  left join public.profiles p  on p.user_id = a.customer_user_id
  left join auth.users au      on au.id = a.customer_user_id
  where a.id = p_appointment_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.staff_get_appointment(p_appointment_id uuid)
 RETURNS TABLE(id uuid, service_id uuid, staff_member_id uuid, starts_at timestamp with time zone, ends_at timestamp with time zone, status text, notes text, created_at timestamp with time zone, customer_user_id uuid, customer_name text, customer_email text, customer_phone text, service_name text, service_duration_minutes integer, service_price_cents integer, staff_display_name text, org_timezone text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
begin
  return query
  select
    a.id,
    a.service_id,
    a.staff_member_id,
    a.starts_at,
    a.ends_at,
    a.status,
    a.notes,
    a.created_at,
    a.customer_user_id,
    coalesce(nullif(btrim(p.full_name), ''), a.guest_name, au.email, 'Cliente sin nombre')::text as customer_name,
    coalesce(au.email, a.guest_email)::text as customer_email,
    coalesce(p.phone, a.guest_phone)::text as customer_phone,
    s.name::text        as service_name,
    s.duration_minutes::integer as service_duration_minutes,
    coalesce(a.price_cents, s.price_cents)::integer as service_price_cents,
    sm.display_name::text       as staff_display_name,
    coalesce(o.timezone, 'UTC')::text as org_timezone
  from public.appointments a
  join public.services s       on s.id  = a.service_id
  join public.staff_members sm on sm.id = a.staff_member_id
  join public.organizations o  on o.id  = a.organization_id
  left join public.profiles p  on p.user_id = a.customer_user_id
  left join auth.users au      on au.id = a.customer_user_id
  where a.id = p_appointment_id
    and (public.is_admin() or sm.profile_user_id = auth.uid());
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_appointment(p_appointment_id uuid)
 RETURNS TABLE(id uuid, service_id uuid, staff_member_id uuid, starts_at timestamp with time zone, ends_at timestamp with time zone, status text, created_at timestamp with time zone, customer_user_id uuid, service_name text, service_duration_minutes integer, service_price_cents integer, staff_display_name text, org_name text, org_timezone text, customer_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
    select
      a.id,
      a.service_id,
      a.staff_member_id,
      a.starts_at,
      a.ends_at,
      a.status,
      a.created_at,
      a.customer_user_id,
      s.name             as service_name,
      s.duration_minutes as service_duration_minutes,
      coalesce(a.price_cents, s.price_cents) as service_price_cents,
      sm.display_name    as staff_display_name,
      o.name             as org_name,
      o.timezone         as org_timezone,
      coalesce(pr.full_name, a.guest_name, '')  as customer_name
    from public.appointments a
    join public.services      s  on s.id  = a.service_id
    join public.staff_members sm on sm.id = a.staff_member_id
    join public.organizations o  on o.id  = a.organization_id
    left join public.profiles pr on pr.user_id = a.customer_user_id
    where a.id = p_appointment_id
      and (
        a.customer_user_id = auth.uid()
        or is_staff_or_admin()
      );
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_get_stats(p_from date DEFAULT NULL::date, p_to date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  v_tz          text;
  v_month_start date;
  v_result      jsonb;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden ver las estadísticas.' using errcode = 'P0001';
  end if;

  select coalesce(o.timezone, 'UTC') into v_tz from public.organizations o limit 1;
  v_tz := coalesce(v_tz, 'UTC');
  v_month_start := date_trunc('month', now() at time zone v_tz)::date;

  with done as (
    select a.staff_member_id,
           a.customer_user_id,
           coalesce(a.customer_user_id::text, 'guest:' || lower(coalesce(a.guest_name, ''))) as client_key,
           a.guest_name,
           (a.starts_at at time zone v_tz)::date as local_day,
           coalesce(a.price_cents, s.price_cents) as revenue
      from public.appointments a
      join public.services s on s.id = a.service_id
     where a.status in ('confirmed', 'completed')
       and a.starts_at < now()
  ),
  period as (
    select * from done d
     where (p_from is null or d.local_day >= p_from) and (p_to is null or d.local_day <= p_to)
  ),
  totals as (
    select count(*) as services,
           coalesce(sum(revenue), 0) as revenue_cents,
           count(distinct client_key) as clients
      from period
  ),
  pros as (
    select sm.id as staff_member_id,
           sm.display_name::text as display_name,
           count(pd.*) as services,
           coalesce(sum(pd.revenue), 0) as revenue_cents
      from public.staff_members sm
      left join period pd on pd.staff_member_id = sm.id
     where sm.is_active
     group by sm.id, sm.display_name
  ),
  months as (
    select m.month_start::date as month_start,
           coalesce(t.services, 0) as services,
           coalesce(t.revenue, 0) as revenue_cents
      from generate_series(v_month_start - interval '11 months', v_month_start, interval '1 month') as m(month_start)
      left join (
        select date_trunc('month', d.local_day)::date as month_start, count(*) as services, sum(d.revenue) as revenue
          from done d
         group by 1
      ) t on t.month_start = m.month_start::date
  ),
  top_clients as (
    select pd.client_key as customer_user_id,
           coalesce(nullif(btrim(p.full_name), ''), max(pd.guest_name), au.email, 'Cliente sin nombre')::text as name,
           count(*) as visits,
           coalesce(sum(pd.revenue), 0) as spent_cents
      from period pd
      left join public.profiles p on p.user_id = pd.customer_user_id
      left join auth.users au on au.id = pd.customer_user_id
     group by pd.client_key, pd.customer_user_id, p.full_name, au.email
     order by count(*) desc, coalesce(sum(pd.revenue), 0) desc
     limit 10
  )
  select jsonb_build_object(
    'totals', (select to_jsonb(t) from totals t),
    'professionals', (select coalesce(jsonb_agg(to_jsonb(x) order by x.services desc, x.revenue_cents desc), '[]'::jsonb) from pros x),
    'months', (select coalesce(jsonb_agg(jsonb_build_object(
                  'month', to_char(m.month_start, 'YYYY-MM'),
                  'services', m.services,
                  'revenue_cents', m.revenue_cents) order by m.month_start), '[]'::jsonb) from months m),
    'clients', (select coalesce(jsonb_agg(to_jsonb(c) order by c.visits desc, c.spent_cents desc), '[]'::jsonb) from top_clients c)
  ) into v_result;

  return v_result;
end;
$function$;
