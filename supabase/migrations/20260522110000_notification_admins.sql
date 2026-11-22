-- Which administrators get a copy of the appointment emails (Negocio > Política > Notificaciones).
-- Everyone who is an administrator receives them by default; the admin can switch some off.

alter table public.user_roles
  add column if not exists notify_appointments boolean not null default true;

-- The administrators and whether each one gets the copies
create or replace function public.admin_list_notification_admins()
returns table (
  user_id uuid,
  name    text,
  email   text,
  notify  boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden ver los avisos.' using errcode = 'P0001';
  end if;

  return query
  select ur.user_id,
         coalesce(nullif(btrim(p.full_name), ''), split_part(au.email, '@', 1), '')::text,
         au.email::text,
         ur.notify_appointments
    from public.user_roles ur
    join auth.users au on au.id = ur.user_id
    left join public.profiles p on p.user_id = ur.user_id
   where ur.role = 'admin'
   order by lower(coalesce(nullif(btrim(p.full_name), ''), au.email));
end;
$$;

-- Turns the copies on for the given administrators and off for the other ones
create or replace function public.admin_set_notification_admins(p_user_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden cambiar los avisos.' using errcode = 'P0001';
  end if;

  update public.user_roles
     set notify_appointments = (user_id = any(coalesce(p_user_ids, '{}'::uuid[])))
   where role = 'admin';
end;
$$;

revoke all on function public.admin_list_notification_admins() from public, anon;
revoke all on function public.admin_set_notification_admins(uuid[]) from public, anon;
grant execute on function public.admin_list_notification_admins() to authenticated;
grant execute on function public.admin_set_notification_admins(uuid[]) to authenticated;
