-- Cuentas que ya son de algún profesional, aunque ese profesional no aparezca en la lista de
-- Profesionales (admin_list_staff_members oculta las fichas cuya cuenta ya no tiene el rol staff).
-- Sirve para no ofrecer esas cuentas al vincular un profesional sin cuenta.

create or replace function public.admin_staff_linked_user_ids()
returns table (user_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select sm.profile_user_id
    from public.staff_members sm
   where public.is_admin()
     and sm.profile_user_id is not null;
$$;

revoke all on function public.admin_staff_linked_user_ids() from public, anon;
grant execute on function public.admin_staff_linked_user_ids() to authenticated;
