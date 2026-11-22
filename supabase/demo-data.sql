-- Datos de prueba para navegar la app con escenarios realistas.
--
-- NO es una migración: se corre a mano y se puede volver a correr. Cada corrida BORRA todos los
-- turnos, cupones, servicios y categorías, y los vuelve a crear. No toca cuentas ni roles.
--
--   npx supabase db query --remote --yes -f supabase/demo-data.sql
--
-- Qué crea:
--   * 5 categorías y 12 servicios con precios y duraciones razonables
--   * 4 profesionales nuevos SIN cuenta (Lucía, Camila, Valentina, Julieta) con horarios, y servicios
--     asignados a ellas y a las 2 profesionales con cuenta que ya existen
--   * ~14 clientes SIN cuenta (personas cargadas por nombre) y los 2 clientes con cuenta existentes
--   * turnos de los últimos 100 días (la mayoría completados, algunos cancelados),
--     de hoy y de las próximas 3 semanas
--   * 3 cupones (uno vigente en el sitio, uno por categoría, uno vencido) y 2 turnos con cupón
--
-- Los avisos por email se apagan mientras se cargan los turnos, así no se manda nada a nadie.
-- Los emails de las personas de prueba usan @example.com.

begin;

alter table public.appointments disable trigger appointments_notify_event;

-- ── Limpiar ───────────────────────────────────────────────────────────────────

delete from public.appointments where true;          -- también borra los usos de cupones
delete from public.coupons where true;
delete from public.services where true;              -- también borra servicios asignados y fechas
delete from public.service_categories where true;
-- Profesional de prueba suelto de antes
delete from public.staff_members where display_name = 'test' and profile_user_id is null;
-- Profesionales sin cuenta de una corrida anterior de este script
delete from public.staff_members
 where profile_user_id is null
   and display_name in ('Lucía Fernández', 'Camila Torres', 'Valentina Ríos', 'Julieta Mansilla');

do $demo$
declare
  v_org     uuid;
  v_admin   uuid;
  v_tz      text;
  v_silvana uuid;   -- cliente con cuenta
  v_maxi    uuid;   -- cliente con cuenta (inactivo)

  v_cat_faciales uuid; v_cat_manos uuid; v_cat_pies uuid; v_cat_cejas uuid; v_cat_masajes uuid;

  v_lucia uuid; v_camila uuid; v_valentina uuid; v_julieta uuid;
  v_sunny uuid; v_prof_silvana uuid;

  guest_names  text[] := array['Laura Gómez','Martina Pérez','Sofía Álvarez','Carolina Díaz','Florencia Ruiz',
                               'Agustina Molina','Julieta Sosa','Romina Castro','Natalia Herrera','Pamela Ortiz',
                               'Valeria Medina','Daniela Silva','Lucrecia Vega','Paula Rojas'];
  v_day     date;
  v_today   date;   -- hoy en la zona horaria del negocio
  v_staff   record;
  v_svc     record;
  v_win_s   time;
  v_win_e   time;
  v_cursor  time;
  v_end_t   time;
  v_n       int;
  v_i       int;
  v_ts      timestamptz;
  v_te      timestamptz;
  v_status  text;
  v_r       float;
  v_c       float;
  v_guest   int;
  v_cust    uuid;
  v_gname   text;
  v_gphone  text;
  v_gemail  text;
  v_created timestamptz;
  v_prob    float;
  v_coupon_a uuid; v_coupon_b uuid; v_appt uuid; v_disc int;
begin
  perform setseed(0.37);

  select o.id, coalesce(o.timezone, 'UTC') into v_org, v_tz from public.organizations o limit 1;
  v_today := (now() at time zone v_tz)::date;
  select ur.user_id into v_admin from public.user_roles ur where ur.role = 'admin' order by ur.created_at limit 1;
  select u.id into v_silvana from auth.users u where u.email = 'silvana.trabalon@gmail.com';
  select u.id into v_maxi    from auth.users u where u.email = 'maxiinsfran@gmail.com';

  -- ── Categorías y servicios ─────────────────────────────────────────────────

  insert into public.service_categories (organization_id, name, display_order) values
    (v_org, 'Faciales', 0), (v_org, 'Manos', 1), (v_org, 'Pies', 2),
    (v_org, 'Cejas y pestañas', 3), (v_org, 'Masajes', 4);

  select id into v_cat_faciales from public.service_categories where name = 'Faciales';
  select id into v_cat_manos    from public.service_categories where name = 'Manos';
  select id into v_cat_pies     from public.service_categories where name = 'Pies';
  select id into v_cat_cejas    from public.service_categories where name = 'Cejas y pestañas';
  select id into v_cat_masajes  from public.service_categories where name = 'Masajes';

  insert into public.services (organization_id, name, duration_minutes, price_cents, description, category_id, is_active) values
    (v_org, 'Limpieza facial profunda',     75, 2200000, 'Limpieza, extracción e hidratación para renovar la piel.', v_cat_faciales, true),
    (v_org, 'Hidratación facial',           45, 1400000, 'Mascarilla hidratante y masaje facial suave.', v_cat_faciales, true),
    (v_org, 'Peeling suave',                45, 1600000, null, v_cat_faciales, true),
    (v_org, 'Manicura clásica',             45,  900000, 'Limado, cutículas y esmaltado.', v_cat_manos, true),
    (v_org, 'Esmaltado semipermanente',     60, 1200000, 'Dura hasta 3 semanas.', v_cat_manos, true),
    (v_org, 'Uñas esculpidas',             120, 2600000, null, v_cat_manos, true),
    (v_org, 'Pedicura spa',                 75, 1400000, 'Exfoliación, masaje y esmaltado.', v_cat_pies, true),
    (v_org, 'Belleza de pies',              60, 1100000, null, v_cat_pies, true),
    (v_org, 'Perfilado de cejas',           30,  650000, null, v_cat_cejas, true),
    (v_org, 'Lifting de pestañas',          75, 1800000, 'Curvatura y tinte para una mirada abierta.', v_cat_cejas, true),
    (v_org, 'Masaje relajante',             60, 1700000, 'Masaje de cuerpo completo con aceites tibios.', v_cat_masajes, true),
    (v_org, 'Masaje descontracturante',     45, 1600000, null, v_cat_masajes, true);

  -- ── Profesionales ──────────────────────────────────────────────────────────

  select id into v_sunny        from public.staff_members where display_name = 'Admin user' limit 1;
  select id into v_prof_silvana from public.staff_members where display_name = 'Profesional user' limit 1;

  insert into public.staff_members (organization_id, profile_user_id, display_name, invite_email)
  values (v_org, null, 'Lucía Fernández', null) returning id into v_lucia;
  insert into public.staff_members (organization_id, profile_user_id, display_name, invite_email)
  values (v_org, null, 'Camila Torres', 'camila.torres@example.com') returning id into v_camila;
  insert into public.staff_members (organization_id, profile_user_id, display_name, invite_email)
  values (v_org, null, 'Valentina Ríos', null) returning id into v_valentina;
  insert into public.staff_members (organization_id, profile_user_id, display_name, invite_email)
  values (v_org, null, 'Julieta Mansilla', null) returning id into v_julieta;

  -- Horarios semanales (el negocio abre lunes a viernes de 8 a 21)
  delete from public.staff_schedules
   where staff_member_id in (v_lucia, v_camila, v_valentina, v_julieta, v_prof_silvana);

  insert into public.staff_schedules (staff_member_id, day_of_week, is_working, starts_at, ends_at)
  select s.id, d.dow,
         d.dow between 1 and 5 and (
           (s.id = v_lucia and true) or
           (s.id = v_camila and d.dow between 2 and 5) or
           (s.id = v_valentina and d.dow in (1, 3, 5)) or
           (s.id = v_julieta and d.dow between 1 and 4) or
           (s.id = v_prof_silvana and true)),
         case when d.dow between 1 and 5 and (
           (s.id = v_lucia) or (s.id = v_camila and d.dow between 2 and 5) or
           (s.id = v_valentina and d.dow in (1, 3, 5)) or (s.id = v_julieta and d.dow between 1 and 4) or
           (s.id = v_prof_silvana)) then
           case s.id when v_lucia then time '09:00' when v_camila then time '10:00'
                     when v_valentina then time '08:00' when v_julieta then time '12:00' else time '10:00' end
         end,
         case when d.dow between 1 and 5 and (
           (s.id = v_lucia) or (s.id = v_camila and d.dow between 2 and 5) or
           (s.id = v_valentina and d.dow in (1, 3, 5)) or (s.id = v_julieta and d.dow between 1 and 4) or
           (s.id = v_prof_silvana)) then
           case s.id when v_lucia then time '18:00' when v_camila then time '19:00'
                     when v_valentina then time '16:00' when v_julieta then time '21:00' else time '19:00' end
         end
    from (values (v_lucia), (v_camila), (v_valentina), (v_julieta), (v_prof_silvana)) as s(id)
    cross join generate_series(0, 6) as d(dow);

  -- Servicios por profesional
  insert into public.staff_services (staff_member_id, service_id, organization_id)
  select p.staff_id, sv.id, v_org
    from (values
      (v_lucia,         'Faciales'),
      (v_lucia,         'Cejas y pestañas'),
      (v_camila,        'Manos'),
      (v_camila,        'Pies'),
      (v_valentina,     'Masajes'),
      (v_valentina,     'Faciales'),
      (v_julieta,       'Manos'),
      (v_julieta,       'Pies'),
      (v_julieta,       'Cejas y pestañas'),
      (v_sunny,         'Pies'),
      (v_sunny,         'Manos'),
      (v_prof_silvana,  'Faciales'),
      (v_prof_silvana,  'Masajes')
    ) as p(staff_id, category_name)
    join public.service_categories c on c.name = p.category_name
    join public.services sv on sv.category_id = c.id
  on conflict do nothing;

  -- ── Cupones ────────────────────────────────────────────────────────────────

  insert into public.coupons (organization_id, code, description, discount_type, discount_value, category_id,
                              starts_on, ends_on, is_active, show_on_site)
  values (v_org, 'VERANO10', 'Descuento de verano en todos los servicios', 'percent', 10, null,
          (now() at time zone v_tz)::date - 10, (now() at time zone v_tz)::date + 40, true, true)
  returning id into v_coupon_a;

  insert into public.coupons (organization_id, code, description, discount_type, discount_value, category_id,
                              starts_on, ends_on, is_active, show_on_site)
  values (v_org, 'MANOS2000', 'Manos más lindas: $2.000 de descuento', 'fixed', 200000, v_cat_manos,
          null, (now() at time zone v_tz)::date + 25, true, true)
  returning id into v_coupon_b;

  insert into public.coupons (organization_id, code, description, discount_type, discount_value, category_id,
                              starts_on, ends_on, is_active, show_on_site)
  values (v_org, 'BIENVENIDA15', 'Para clientas nuevas (vencido)', 'percent', 15, null,
          (now() at time zone v_tz)::date - 90, (now() at time zone v_tz)::date - 20, true, false);

  -- ── Turnos ─────────────────────────────────────────────────────────────────

  for v_day in select g::date from generate_series(v_today - 100, v_today + 21, interval '1 day') g loop
    -- hoy se arma aparte, con turnos garantizados (más abajo)
    continue when v_day = v_today;
    -- días en que el negocio abre
    continue when not exists (
      select 1 from public.business_hours bh
       where bh.organization_id = v_org
         and bh.day_of_week = extract(dow from v_day)::int
         and bh.is_closed = false);

    for v_staff in
      select sm.id as staff_id, sc.starts_at as win_s, sc.ends_at as win_e
        from public.staff_members sm
        join public.staff_schedules sc
          on sc.staff_member_id = sm.id
         and sc.day_of_week = extract(dow from v_day)::int
         and sc.is_working = true
       where sm.is_active
         and sm.id in (v_lucia, v_camila, v_valentina, v_julieta, v_sunny, v_prof_silvana)
         and sc.starts_at is not null
    loop
      v_win_s := v_staff.win_s;
      v_win_e := v_staff.win_e;
      -- el pasado lejano está más vacío que lo reciente; el futuro cercano tiene menos turnos
      v_prob := case when v_day < v_today - 60 then 0.30
                     when v_day < v_today then 0.42
                     else 0.28 end;
      continue when random() >= v_prob;

      v_n := 1 + (random() < 0.35)::int + (random() < 0.10)::int;
      v_cursor := v_win_s + (floor(random() * 4) * interval '30 minutes');

      for v_i in 1..v_n loop
        select sv.id, sv.duration_minutes, sv.price_cents, sv.category_id
          into v_svc
          from public.staff_services ss
          join public.services sv on sv.id = ss.service_id
         where ss.staff_member_id = v_staff.staff_id
         order by random() limit 1;
        exit when v_svc.id is null;

        v_end_t := v_cursor + (v_svc.duration_minutes * interval '1 minute');
        exit when v_end_t <= v_cursor or v_end_t > v_win_e;

        v_ts := (v_day + v_cursor) at time zone v_tz;
        v_te := (v_day + v_end_t) at time zone v_tz;

        -- estado según el momento
        v_r := random();
        if v_te < now() then
          v_status := case when v_r < 0.84 then 'completed' else 'cancelled' end;
        elsif v_ts <= now() then
          v_status := 'confirmed';
        else
          v_status := case when v_r < 0.88 then 'confirmed' else 'cancelled' end;
        end if;

        -- cliente: con cuenta (pocos) o una persona cargada por nombre
        v_c := random();
        v_cust := null; v_gname := null; v_gphone := null; v_gemail := null;
        if v_c < 0.12 and v_silvana is not null then
          v_cust := v_silvana;
        elsif v_c < 0.18 and v_maxi is not null then
          v_cust := v_maxi;
        else
          v_guest := 1 + floor(random() * array_length(guest_names, 1))::int;
          v_gname := guest_names[v_guest];
          v_gphone := case when v_guest % 3 <> 0 then '11-5555-' || lpad((1000 + v_guest * 37)::text, 4, '0') end;
          v_gemail := case when v_guest % 2 = 0
                           then lower(replace(translate(v_gname, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN'), ' ', '.')) || '@example.com' end;
        end if;

        v_created := least(now(), v_ts - ((1 + floor(random() * 10)) * interval '1 day')
                                       - (floor(random() * 600) * interval '1 minute'));

        insert into public.appointments (
          organization_id, service_id, staff_member_id, customer_user_id, created_by_user_id,
          starts_at, ends_at, status, price_cents, original_price_cents, discount_cents,
          guest_name, guest_phone, guest_email, created_at, updated_at)
        values (
          v_org, v_svc.id, v_staff.staff_id, v_cust, coalesce(v_cust, v_admin),
          v_ts, v_te, v_status, v_svc.price_cents, v_svc.price_cents, 0,
          v_gname, v_gphone, v_gemail, v_created, v_created);

        v_cursor := v_end_t + (30 + floor(random() * 3) * 30) * interval '1 minute';
        exit when v_cursor >= v_win_e;
      end loop;
    end loop;
  end loop;


  -- ── Turnos de HOY, garantizados ─────────────────────────────────────────────
  -- Aunque el negocio esté cerrado hoy, se cargan para poder ver cómo se ve un día con turnos:
  -- los de la mañana quedan completados, el que está en curso o por venir queda confirmado.
  insert into public.appointments (
    organization_id, service_id, staff_member_id, customer_user_id, created_by_user_id,
    starts_at, ends_at, status, price_cents, original_price_cents, discount_cents,
    guest_name, guest_phone, guest_email, created_at, updated_at)
  select v_org, sv.id, t.staff_id, null, v_admin,
         (v_today + t.start_t) at time zone v_tz,
         (v_today + t.start_t + sv.duration_minutes * interval '1 minute') at time zone v_tz,
         case when (v_today + t.start_t + sv.duration_minutes * interval '1 minute') at time zone v_tz < now()
              then 'completed' else 'confirmed' end,
         sv.price_cents, sv.price_cents, 0,
         t.guest, t.phone, t.email,
         now() - interval '3 days', now() - interval '3 days'
    from (values
      (v_lucia,        time '09:00', 'Limpieza facial profunda', 'Laura Gómez',    '11-5555-1037', 'laura.gomez@example.com'),
      (v_camila,       time '10:30', 'Manicura clásica',         'Martina Pérez',  '11-5555-1074', null),
      (v_valentina,    time '11:00', 'Masaje relajante',         'Sofía Álvarez',  null,           'sofia.alvarez@example.com'),
      (v_julieta,      time '13:30', 'Perfilado de cejas',       'Carolina Díaz',  '11-5555-1148', null),
      (v_sunny,        time '15:00', 'Pedicura spa',             'Florencia Ruiz', '11-5555-1185', 'florencia.ruiz@example.com'),
      (v_prof_silvana, time '16:30', 'Hidratación facial',       'Agustina Molina', null,          null),
      (v_lucia,        time '17:30', 'Lifting de pestañas',      'Romina Castro',  '11-5555-1259', 'romina.castro@example.com'),
      (v_camila,       time '18:00', 'Esmaltado semipermanente', 'Natalia Herrera', '11-5555-1296', null)
    ) as t(staff_id, start_t, service_name, guest, phone, email)
    join public.services sv on sv.name = t.service_name;

  -- Y dos relativos a este momento, para que siempre haya uno en curso y uno por venir
  -- (si ya es muy tarde, el segundo cae mañana a la mañana).
  insert into public.appointments (
    organization_id, service_id, staff_member_id, customer_user_id, created_by_user_id,
    starts_at, ends_at, status, price_cents, original_price_cents, discount_cents,
    guest_name, guest_phone, guest_email, created_at, updated_at)
  select v_org, sv.id, t.staff_id, null, v_admin,
         t.starts, t.starts + sv.duration_minutes * interval '1 minute',
         'confirmed', sv.price_cents, sv.price_cents, 0,
         t.guest, t.phone, t.email, now() - interval '2 days', now() - interval '2 days'
    from (values
      (v_julieta,   date_trunc('minute', now()) - interval '15 minutes', 'Uñas esculpidas',   'Pamela Ortiz',   '11-5555-1333', 'pamela.ortiz@example.com'),
      (v_valentina, date_trunc('minute', now()) + interval '90 minutes', 'Masaje descontracturante', 'Valeria Medina', null, null)
    ) as t(staff_id, starts, service_name, guest, phone, email)
    join public.services sv on sv.name = t.service_name;

  -- ── Dos turnos con cupón (de la clienta con cuenta) ─────────────────────────

  if v_silvana is not null then
    select a.id, round(a.price_cents * 0.10)::int into v_appt, v_disc
      from public.appointments a
     where a.customer_user_id = v_silvana and a.status = 'completed'
     order by a.starts_at desc limit 1;
    if v_appt is not null then
      update public.appointments
         set discount_cents = v_disc, price_cents = original_price_cents - v_disc, coupon_id = v_coupon_a
       where id = v_appt;
      insert into public.coupon_redemptions (coupon_id, customer_user_id, appointment_id, discount_cents)
      values (v_coupon_a, v_silvana, v_appt, v_disc);
    end if;

    v_appt := null;
    select a.id into v_appt
      from public.appointments a
      join public.services sv on sv.id = a.service_id
     where a.customer_user_id = v_silvana and a.status = 'completed' and sv.category_id = v_cat_manos
       and a.coupon_id is null
     order by a.starts_at desc limit 1;
    if v_appt is not null then
      update public.appointments
         set discount_cents = 200000, price_cents = greatest(original_price_cents - 200000, 0), coupon_id = v_coupon_b
       where id = v_appt;
      insert into public.coupon_redemptions (coupon_id, customer_user_id, appointment_id, discount_cents)
      values (v_coupon_b, v_silvana, v_appt, 200000);
    end if;
  end if;
end
$demo$;

alter table public.appointments enable trigger appointments_notify_event;

commit;
