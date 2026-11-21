-- Coupons.
--
-- The admin creates discount coupons (fixed amount or percentage), optionally limited to a
-- service category, with optional dates and an option to show them on the public site. A client
-- types the code when booking; each coupon can be used once per client (a cancelled appointment
-- frees it again).
--
-- Appointments now keep the price actually charged (price_cents), the original price and the
-- discount, so income statistics reflect what was really charged.
-- create_appointment gets an optional coupon code. Everything goes through SECURITY DEFINER RPCs.

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists public.coupons (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  code             text not null,
  description      text,
  discount_type    text not null check (discount_type in ('percent', 'fixed')),
  -- percent: 1-100. fixed: amount in cents
  discount_value   integer not null check (discount_value > 0),
  category_id      uuid references public.service_categories(id) on delete cascade,
  starts_on        date,
  ends_on          date,
  is_active        boolean not null default true,
  show_on_site     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint chk_coupon_percent check (discount_type <> 'percent' or discount_value <= 100),
  constraint chk_coupon_dates check (starts_on is null or ends_on is null or starts_on <= ends_on),
  constraint chk_coupon_code check (code = upper(btrim(code)) and length(code) between 3 and 30)
);

create unique index if not exists uq_coupons_org_code on public.coupons (organization_id, code);

create table if not exists public.coupon_redemptions (
  id                uuid primary key default gen_random_uuid(),
  coupon_id         uuid not null references public.coupons(id) on delete cascade,
  customer_user_id  uuid not null,
  appointment_id    uuid not null unique references public.appointments(id) on delete cascade,
  discount_cents    integer not null,
  created_at        timestamptz not null default now()
);

create index if not exists idx_coupon_redemptions_coupon_user
  on public.coupon_redemptions (coupon_id, customer_user_id);

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
revoke all on table public.coupons, public.coupon_redemptions from anon, authenticated;

alter table public.appointments
  add column if not exists price_cents          integer,
  add column if not exists original_price_cents integer,
  add column if not exists discount_cents       integer,
  add column if not exists coupon_id            uuid references public.coupons(id) on delete set null;

-- ── Resolve a coupon for a service and client (shared by validate and create) ──

create or replace function public._resolve_coupon(
  p_service_id uuid,
  p_code       text,
  p_user_id    uuid
)
returns table (coupon_id uuid, discount_cents integer, final_price_cents integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code     text := upper(btrim(coalesce(p_code, '')));
  v_service  public.services%rowtype;
  v_coupon   public.coupons%rowtype;
  v_tz       text;
  v_today    date;
  v_discount integer;
begin
  select * into v_service from public.services s where s.id = p_service_id and s.is_active = true;
  if not found then
    raise exception 'BOOKING_SERVICE_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_coupon from public.coupons c
   where c.organization_id = v_service.organization_id and c.code = v_code;
  if not found then
    raise exception 'COUPON_NOT_FOUND' using errcode = 'P0001';
  end if;

  if not v_coupon.is_active then
    raise exception 'COUPON_INACTIVE' using errcode = 'P0001';
  end if;

  select coalesce(o.timezone, 'UTC') into v_tz from public.organizations o where o.id = v_service.organization_id;
  v_today := (now() at time zone v_tz)::date;

  if v_coupon.starts_on is not null and v_today < v_coupon.starts_on then
    raise exception 'COUPON_NOT_STARTED' using errcode = 'P0001';
  end if;
  if v_coupon.ends_on is not null and v_today > v_coupon.ends_on then
    raise exception 'COUPON_EXPIRED' using errcode = 'P0001';
  end if;

  if v_coupon.category_id is not null and v_service.category_id is distinct from v_coupon.category_id then
    raise exception 'COUPON_WRONG_CATEGORY' using errcode = 'P0001';
  end if;

  -- Serialize concurrent redemptions by the same client
  perform pg_advisory_xact_lock(hashtext(v_coupon.id::text || p_user_id::text));

  if exists (
    select 1
      from public.coupon_redemptions r
      join public.appointments a on a.id = r.appointment_id
     where r.coupon_id = v_coupon.id
       and r.customer_user_id = p_user_id
       and a.status <> 'cancelled'
  ) then
    raise exception 'COUPON_ALREADY_USED' using errcode = 'P0001';
  end if;

  if v_coupon.discount_type = 'percent' then
    v_discount := round(v_service.price_cents * v_coupon.discount_value / 100.0)::integer;
  else
    v_discount := least(v_coupon.discount_value, v_service.price_cents);
  end if;

  coupon_id := v_coupon.id;
  discount_cents := v_discount;
  final_price_cents := greatest(v_service.price_cents - v_discount, 0);
  return next;
end;
$$;

revoke all on function public._resolve_coupon(uuid, text, uuid) from public, anon, authenticated;

-- Customer: check a code before booking
create or replace function public.validate_coupon(p_service_id uuid, p_code text)
returns table (coupon_id uuid, discount_cents integer, final_price_cents integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'BOOKING_UNAUTHORIZED' using errcode = 'P0001';
  end if;
  return query select * from public._resolve_coupon(p_service_id, p_code, auth.uid());
end;
$$;

revoke all on function public.validate_coupon(uuid, text) from public, anon;
grant execute on function public.validate_coupon(uuid, text) to authenticated;

-- ── create_appointment with an optional coupon ─────────────────────────────────

drop function if exists public.create_appointment(uuid, timestamptz);

create or replace function public.create_appointment(
  p_service_id  uuid,
  p_starts_at   timestamptz,
  p_coupon_code text default null
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
      from public._resolve_coupon(p_service_id, p_coupon_code, v_user_id) rc;
  end if;

  insert into public.appointments (
    organization_id, service_id, staff_member_id, customer_user_id,
    created_by_user_id, starts_at, ends_at, status,
    price_cents, original_price_cents, discount_cents, coupon_id
  )
  values (
    v_org.id, p_service_id, v_staff_id, v_user_id,
    v_user_id, p_starts_at, v_ends_at, 'confirmed',
    v_final_price, v_service.price_cents, v_discount, v_coupon_id
  )
  returning appointments.id into v_appointment_id;

  if v_coupon_id is not null then
    insert into public.coupon_redemptions (coupon_id, customer_user_id, appointment_id, discount_cents)
    values (v_coupon_id, v_user_id, v_appointment_id, v_discount);
  end if;

  return query
    select appt.id, appt.service_id, appt.staff_member_id, appt.starts_at,
           appt.ends_at, appt.status, appt.created_at
      from public.appointments appt
     where appt.id = v_appointment_id;
end;
$$;

revoke all on function public.create_appointment(uuid, timestamptz, text) from public, anon;
grant execute on function public.create_appointment(uuid, timestamptz, text) to authenticated;

-- ── Appointment details show the price actually charged ────────────────────────

create or replace function public.get_appointment(
  p_appointment_id uuid
)
returns table(
  id                       uuid,
  service_id               uuid,
  staff_member_id          uuid,
  starts_at                timestamptz,
  ends_at                  timestamptz,
  status                   text,
  created_at               timestamptz,
  customer_user_id         uuid,
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
      coalesce(pr.full_name, '')  as customer_name
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
$$;

create or replace function public.admin_get_appointment(p_appointment_id uuid)
returns table (
  id                       uuid,
  service_id               uuid,
  staff_member_id          uuid,
  starts_at                timestamptz,
  ends_at                  timestamptz,
  status                   text,
  notes                    text,
  created_at               timestamptz,
  customer_user_id         uuid,
  customer_name            text,
  customer_email           text,
  customer_phone           text,
  service_name             text,
  service_duration_minutes integer,
  service_price_cents      integer,
  staff_display_name       text,
  org_timezone             text
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
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
    coalesce(nullif(btrim(p.full_name), ''), au.email, 'Cliente sin nombre')::text as customer_name,
    au.email::text      as customer_email,
    p.phone::text       as customer_phone,
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
$$;

create or replace function public.staff_get_appointment(p_appointment_id uuid)
returns table (
  id                       uuid,
  service_id               uuid,
  staff_member_id          uuid,
  starts_at                timestamptz,
  ends_at                  timestamptz,
  status                   text,
  notes                    text,
  created_at               timestamptz,
  customer_user_id         uuid,
  customer_name            text,
  customer_email           text,
  customer_phone           text,
  service_name             text,
  service_duration_minutes integer,
  service_price_cents      integer,
  staff_display_name       text,
  org_timezone             text
)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
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
    coalesce(nullif(btrim(p.full_name), ''), au.email, 'Cliente sin nombre')::text as customer_name,
    au.email::text      as customer_email,
    p.phone::text       as customer_phone,
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
$$;

-- ── Admin CRUD ────────────────────────────────────────────────────────────────

create or replace function public.admin_list_coupons()
returns table (
  id             uuid,
  code           text,
  description    text,
  discount_type  text,
  discount_value integer,
  category_id    uuid,
  category_name  text,
  starts_on      date,
  ends_on        date,
  is_active      boolean,
  show_on_site   boolean,
  times_used     bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden ver los cupones.' using errcode = 'P0001';
  end if;

  return query
  select
    c.id, c.code, c.description, c.discount_type, c.discount_value,
    c.category_id, sc.name::text, c.starts_on, c.ends_on, c.is_active, c.show_on_site,
    (select count(*) from public.coupon_redemptions r
       join public.appointments a on a.id = r.appointment_id
      where r.coupon_id = c.id and a.status <> 'cancelled') as times_used
  from public.coupons c
  left join public.service_categories sc on sc.id = c.category_id
  order by c.created_at desc;
end;
$$;

create or replace function public.admin_upsert_coupon(
  p_id             uuid,
  p_code           text,
  p_description    text,
  p_discount_type  text,
  p_discount_value integer,
  p_category_id    uuid,
  p_starts_on      date,
  p_ends_on        date,
  p_is_active      boolean,
  p_show_on_site   boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org  uuid;
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_id   uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden editar cupones.' using errcode = 'P0001';
  end if;

  if length(v_code) < 3 or length(v_code) > 30 or v_code !~ '^[A-Z0-9_-]+$' then
    raise exception 'COUPON_CODE_INVALID' using errcode = 'P0001';
  end if;
  if p_discount_type not in ('percent', 'fixed') or p_discount_value is null or p_discount_value <= 0
     or (p_discount_type = 'percent' and p_discount_value > 100) then
    raise exception 'COUPON_VALUE_INVALID' using errcode = 'P0001';
  end if;
  if p_starts_on is not null and p_ends_on is not null and p_starts_on > p_ends_on then
    raise exception 'COUPON_DATES_INVALID' using errcode = 'P0001';
  end if;

  select o.id into v_org from public.organizations o limit 1;

  if p_id is null then
    begin
      insert into public.coupons
        (organization_id, code, description, discount_type, discount_value, category_id,
         starts_on, ends_on, is_active, show_on_site)
      values
        (v_org, v_code, nullif(btrim(coalesce(p_description, '')), ''), p_discount_type, p_discount_value,
         p_category_id, p_starts_on, p_ends_on, coalesce(p_is_active, true), coalesce(p_show_on_site, false))
      returning coupons.id into v_id;
    exception when unique_violation then
      raise exception 'COUPON_CODE_TAKEN' using errcode = 'P0001';
    end;
  else
    begin
      update public.coupons c
         set code = v_code,
             description = nullif(btrim(coalesce(p_description, '')), ''),
             discount_type = p_discount_type,
             discount_value = p_discount_value,
             category_id = p_category_id,
             starts_on = p_starts_on,
             ends_on = p_ends_on,
             is_active = coalesce(p_is_active, c.is_active),
             show_on_site = coalesce(p_show_on_site, c.show_on_site),
             updated_at = now()
       where c.id = p_id
      returning c.id into v_id;
    exception when unique_violation then
      raise exception 'COUPON_CODE_TAKEN' using errcode = 'P0001';
    end;
    if v_id is null then
      raise exception 'COUPON_NOT_FOUND' using errcode = 'P0001';
    end if;
  end if;

  return v_id;
end;
$$;

create or replace function public.admin_set_coupon_active(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = 'P0001';
  end if;
  update public.coupons c set is_active = p_active, updated_at = now() where c.id = p_id;
  if not found then
    raise exception 'COUPON_NOT_FOUND' using errcode = 'P0001';
  end if;
end;
$$;

-- A coupon that was already used is deactivated instead of deleted, to keep the history
create or replace function public.admin_delete_coupon(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.coupon_redemptions r where r.coupon_id = p_id) then
    update public.coupons c set is_active = false, show_on_site = false, updated_at = now() where c.id = p_id;
    return 'deactivated';
  end if;

  delete from public.coupons c where c.id = p_id;
  if not found then
    raise exception 'COUPON_NOT_FOUND' using errcode = 'P0001';
  end if;
  return 'deleted';
end;
$$;

-- Public: coupons the admin chose to show on the website
create or replace function public.list_public_coupons()
returns table (
  code           text,
  description    text,
  discount_type  text,
  discount_value integer,
  category_name  text,
  ends_on        date
)
language sql
stable
security definer
set search_path = public
as $$
  select c.code, c.description, c.discount_type, c.discount_value, sc.name::text, c.ends_on
  from public.coupons c
  left join public.service_categories sc on sc.id = c.category_id
  join public.organizations o on o.id = c.organization_id
  where c.is_active
    and c.show_on_site
    and (c.starts_on is null or c.starts_on <= (now() at time zone coalesce(o.timezone, 'UTC'))::date)
    and (c.ends_on   is null or c.ends_on   >= (now() at time zone coalesce(o.timezone, 'UTC'))::date)
  order by c.created_at desc;
$$;

revoke all on function public.admin_list_coupons() from public, anon;
revoke all on function public.admin_upsert_coupon(uuid, text, text, text, integer, uuid, date, date, boolean, boolean) from public, anon;
revoke all on function public.admin_set_coupon_active(uuid, boolean) from public, anon;
revoke all on function public.admin_delete_coupon(uuid) from public, anon;
grant execute on function public.admin_list_coupons() to authenticated;
grant execute on function public.admin_upsert_coupon(uuid, text, text, text, integer, uuid, date, date, boolean, boolean) to authenticated;
grant execute on function public.admin_set_coupon_active(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_coupon(uuid) to authenticated;
grant execute on function public.list_public_coupons() to anon, authenticated;
