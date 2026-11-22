-- Promos: a promotion on chosen services, with dates, that applies by itself when booking.
--
-- It is like a coupon without a code, without an image and always public: the admin picks the
-- services, a discount (percentage or fixed amount) and a validity (from and to, both required).
-- While it is valid and active, the booking screen shows those services as "in promo" with the
-- old and the new price, and create_appointment charges the promo price for everyone (a client,
-- or admin and staff booking for someone else). A promo does not add up with a coupon: with a
-- promo on the service a coupon is rejected. If two promos cover a service the bigger discount wins.

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists public.promos (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null check (length(btrim(name)) between 2 and 60),
  description      text,
  discount_type    text not null check (discount_type in ('percent', 'fixed')),
  -- percent: 1-100. fixed: amount in cents
  discount_value   integer not null check (discount_value > 0),
  starts_on        date not null,
  ends_on          date not null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint chk_promo_percent check (discount_type <> 'percent' or discount_value <= 100),
  constraint chk_promo_dates check (starts_on <= ends_on)
);

create table if not exists public.promo_services (
  promo_id    uuid not null references public.promos(id) on delete cascade,
  service_id  uuid not null references public.services(id) on delete cascade,
  primary key (promo_id, service_id)
);

create index if not exists idx_promo_services_service on public.promo_services (service_id);

alter table public.promos enable row level security;
alter table public.promo_services enable row level security;
revoke all on table public.promos, public.promo_services from anon, authenticated;

alter table public.appointments
  add column if not exists promo_id uuid references public.promos(id) on delete set null;

-- ── The best promo valid today for a service ──────────────────────────────────

create or replace function public._active_promo(p_service_id uuid, p_price_cents integer)
returns table (promo_id uuid, discount_cents integer)
language sql
stable
security definer
set search_path = public
as $$
  select p.id,
         case when p.discount_type = 'percent'
              then round(p_price_cents * p.discount_value / 100.0)::integer
              else least(p.discount_value, p_price_cents) end as discount
    from public.promos p
    join public.promo_services ps on ps.promo_id = p.id
    join public.services s on s.id = ps.service_id
    join public.organizations o on o.id = p.organization_id
   where ps.service_id = p_service_id
     and p.is_active = true
     and (now() at time zone coalesce(o.timezone, 'UTC'))::date between p.starts_on and p.ends_on
   order by 2 desc, p.created_at asc
   limit 1;
$$;

revoke all on function public._active_promo(uuid, integer) from public, anon, authenticated;

-- ── Booking screen: the services that have a promo today ───────────────────────

create or replace function public.list_active_promos()
returns table (
  service_id        uuid,
  promo_id          uuid,
  name              text,
  description       text,
  discount_type     text,
  discount_value    integer,
  discount_cents    integer,
  final_price_cents integer,
  ends_on           date
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, p.id, p.name::text, p.description, p.discount_type::text, p.discount_value,
         ap.discount_cents, greatest(s.price_cents - ap.discount_cents, 0), p.ends_on
    from public.services s
    cross join lateral public._active_promo(s.id, s.price_cents) ap
    join public.promos p on p.id = ap.promo_id
   where s.is_active = true
     and auth.uid() is not null;
$$;

revoke all on function public.list_active_promos() from public, anon;
grant execute on function public.list_active_promos() to authenticated;

-- ── A coupon is not allowed on a service that has a promo ──────────────────────

CREATE OR REPLACE FUNCTION public._resolve_coupon(p_service_id uuid, p_code text, p_user_id uuid)
 RETURNS TABLE(coupon_id uuid, discount_cents integer, final_price_cents integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- A promo on the service does not add up with a coupon
  if exists (select 1 from public._active_promo(p_service_id, v_service.price_cents)) then
    raise exception 'COUPON_NOT_WITH_PROMO' using errcode = 'P0001';
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
$function$
;

revoke all on function public._resolve_coupon(uuid, text, uuid) from public, anon, authenticated;

-- ── create_appointment applies the promo ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_appointment(p_service_id uuid, p_starts_at timestamp with time zone, p_coupon_code text DEFAULT NULL::text, p_customer_user_id uuid DEFAULT NULL::uuid, p_guest_name text DEFAULT NULL::text, p_guest_phone text DEFAULT NULL::text, p_guest_email text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, service_id uuid, staff_member_id uuid, starts_at timestamp with time zone, ends_at timestamp with time zone, status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  v_promo_id          uuid;
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

  -- A promo on the service applies by itself (to everyone, also when booking for someone else)
  select ap.promo_id, ap.discount_cents
    into v_promo_id, v_discount
    from public._active_promo(p_service_id, v_service.price_cents) ap;
  if v_promo_id is not null then
    v_final_price := greatest(v_service.price_cents - v_discount, 0);
    if p_coupon_code is not null and btrim(p_coupon_code) <> '' then
      raise exception 'COUPON_NOT_WITH_PROMO' using errcode = 'P0001';
    end if;
  else
    v_discount := 0;
  end if;

  if p_coupon_code is not null and btrim(p_coupon_code) <> '' then
    select rc.coupon_id, rc.discount_cents, rc.final_price_cents
      into v_coupon_id, v_discount, v_final_price
      from public._resolve_coupon(p_service_id, p_coupon_code, v_customer_id) rc;
  end if;

  insert into public.appointments (
    organization_id, service_id, staff_member_id, customer_user_id,
    created_by_user_id, starts_at, ends_at, status,
    price_cents, original_price_cents, discount_cents, coupon_id, promo_id,
    guest_name, guest_phone, guest_email
  )
  values (
    v_org.id, p_service_id, v_staff_id, v_customer_id,
    v_user_id, p_starts_at, v_ends_at, 'confirmed',
    v_final_price, v_service.price_cents, v_discount, v_coupon_id, v_promo_id,
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
$function$
;

revoke all on function public.create_appointment(uuid, timestamptz, text, uuid, text, text, text) from public, anon;
grant execute on function public.create_appointment(uuid, timestamptz, text, uuid, text, text, text) to authenticated;

-- ── Admin ─────────────────────────────────────────────────────────────────────

create or replace function public.admin_list_promos()
returns table (
  id              uuid,
  name            text,
  description     text,
  discount_type   text,
  discount_value  integer,
  starts_on       date,
  ends_on         date,
  is_active       boolean,
  service_ids     uuid[],
  service_names   text[],
  times_used      bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden ver las promos.' using errcode = 'P0001';
  end if;

  return query
  select
    p.id, p.name, p.description, p.discount_type, p.discount_value, p.starts_on, p.ends_on, p.is_active,
    coalesce((select array_agg(ps.service_id order by s.name) from public.promo_services ps
                join public.services s on s.id = ps.service_id where ps.promo_id = p.id), '{}'::uuid[]),
    coalesce((select array_agg(s.name::text order by s.name) from public.promo_services ps
                join public.services s on s.id = ps.service_id where ps.promo_id = p.id), '{}'::text[]),
    (select count(*) from public.appointments a where a.promo_id = p.id and a.status <> 'cancelled')
  from public.promos p
  order by p.is_active desc, p.ends_on desc, p.created_at desc;
end;
$$;

create or replace function public.admin_upsert_promo(
  p_id             uuid,
  p_name           text,
  p_description    text,
  p_discount_type  text,
  p_discount_value integer,
  p_starts_on      date,
  p_ends_on        date,
  p_is_active      boolean,
  p_service_ids    uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org     uuid;
  v_id      uuid := p_id;
  v_name    text := btrim(coalesce(p_name, ''));
  v_ids     uuid[] := (select coalesce(array_agg(distinct x), '{}'::uuid[]) from unnest(coalesce(p_service_ids, '{}'::uuid[])) x);
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden guardar promos.' using errcode = 'P0001';
  end if;

  if length(v_name) < 2 or length(v_name) > 60 then
    raise exception 'PROMO_NAME_INVALID' using errcode = 'P0001';
  end if;
  if p_discount_type not in ('percent', 'fixed') or p_discount_value is null or p_discount_value <= 0
     or (p_discount_type = 'percent' and p_discount_value > 100) then
    raise exception 'PROMO_DISCOUNT_INVALID' using errcode = 'P0001';
  end if;
  if p_starts_on is null or p_ends_on is null or p_starts_on > p_ends_on then
    raise exception 'PROMO_DATES_INVALID' using errcode = 'P0001';
  end if;
  if array_length(v_ids, 1) is null then
    raise exception 'PROMO_NO_SERVICES' using errcode = 'P0001';
  end if;

  select o.id into v_org from public.organizations o order by o.created_at limit 1;
  if exists (select 1 from unnest(v_ids) x where not exists (select 1 from public.services s where s.id = x and s.organization_id = v_org)) then
    raise exception 'PROMO_SERVICE_NOT_FOUND' using errcode = 'P0001';
  end if;

  if v_id is null then
    insert into public.promos (organization_id, name, description, discount_type, discount_value, starts_on, ends_on, is_active)
    values (v_org, v_name, nullif(btrim(coalesce(p_description, '')), ''), p_discount_type, p_discount_value, p_starts_on, p_ends_on, coalesce(p_is_active, true))
    returning promos.id into v_id;
  else
    update public.promos
       set name = v_name,
           description = nullif(btrim(coalesce(p_description, '')), ''),
           discount_type = p_discount_type,
           discount_value = p_discount_value,
           starts_on = p_starts_on,
           ends_on = p_ends_on,
           is_active = coalesce(p_is_active, true),
           updated_at = now()
     where promos.id = v_id and promos.organization_id = v_org;
    if not found then
      raise exception 'PROMO_NOT_FOUND' using errcode = 'P0001';
    end if;
  end if;

  delete from public.promo_services where promo_id = v_id and service_id <> all (v_ids);
  insert into public.promo_services (promo_id, service_id)
  select v_id, x from unnest(v_ids) x
  on conflict do nothing;

  return v_id;
end;
$$;

create or replace function public.admin_set_promo_active(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden cambiar promos.' using errcode = 'P0001';
  end if;
  update public.promos set is_active = p_active, updated_at = now() where id = p_id;
  if not found then
    raise exception 'PROMO_NOT_FOUND' using errcode = 'P0001';
  end if;
end;
$$;

-- Deleting a promo keeps what was already charged: the appointments keep their discount
create or replace function public.admin_delete_promo(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden eliminar promos.' using errcode = 'P0001';
  end if;
  delete from public.promos where id = p_id;
  if not found then
    raise exception 'PROMO_NOT_FOUND' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.admin_list_promos() from public, anon;
revoke all on function public.admin_upsert_promo(uuid, text, text, text, integer, date, date, boolean, uuid[]) from public, anon;
revoke all on function public.admin_set_promo_active(uuid, boolean) from public, anon;
revoke all on function public.admin_delete_promo(uuid) from public, anon;
grant execute on function public.admin_list_promos() to authenticated;
grant execute on function public.admin_upsert_promo(uuid, text, text, text, integer, date, date, boolean, uuid[]) to authenticated;
grant execute on function public.admin_set_promo_active(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_promo(uuid) to authenticated;
