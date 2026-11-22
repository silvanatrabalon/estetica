-- Fix of 20260521970000: the guest branch of the union must be parenthesized to use its own ORDER BY.
-- The "Para un cliente" picker lists every client, not only the active accounts, and also the
-- people without account that were already booked before (so they can be booked again without
-- typing their data again).
--
--  * kind 'account': a client account (inactive ones included, flagged with is_active);
--  * kind 'guest': a person without account, taken from earlier appointments (the most recent
--    data for each name + email), with the phone and email that were typed.

drop function if exists public.list_booking_clients();

create or replace function public.list_booking_clients()
returns table (
  kind      text,
  user_id   uuid,
  name      text,
  email     text,
  phone     text,
  is_active boolean
)
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
  select * from (
    select 'account'::text as kind,
           u.id as user_id,
           coalesce(nullif(btrim(p.full_name), ''), '')::text as name,
           u.email::text as email,
           p.phone::text as phone,
           coalesce(bool_and(ur.is_active), true) as is_active
      from auth.users u
      join public.user_roles ur on ur.user_id = u.id and ur.role = 'customer'
      left join public.profiles p on p.user_id = u.id
     group by u.id, p.full_name, u.email, p.phone

    union all

    (select distinct on (lower(a.guest_name), lower(coalesce(a.guest_email, '')))
            'guest'::text,
            null::uuid,
            a.guest_name::text,
            a.guest_email::text,
            a.guest_phone::text,
            true
       from public.appointments a
      where a.guest_name is not null
      order by lower(a.guest_name), lower(coalesce(a.guest_email, '')), a.created_at desc)
  ) x
  order by x.kind, lower(coalesce(nullif(x.name, ''), x.email));
end;
$$;

revoke all on function public.list_booking_clients() from public, anon;
grant execute on function public.list_booking_clients() to authenticated;
