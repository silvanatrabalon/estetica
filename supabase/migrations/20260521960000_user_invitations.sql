-- Add a user before they have signed in.
--
-- The admin saves an email, an optional name and the roles the person will have. If that email
-- already has an account nothing is created (the admin edits its roles instead). Otherwise an
-- invitation is kept, and the first time the person signs in with that email (when their profile
-- is created) the roles are applied. With the staff role a professional without account is also
-- created right away, so they show up in Profesionales and can be given schedules; the existing
-- invitation link for professionals joins it to the account at sign-in.
--
--  * user_invitations holds the pending ones (RLS on, no direct access);
--  * admin_invite_user / admin_list_user_invitations / admin_delete_user_invitation;
--  * a trigger on profiles applies the invitation at first sign-in.

create table if not exists public.user_invitations (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  full_name   text,
  roles       public.app_role[] not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint chk_user_invitations_roles check (cardinality(roles) >= 1),
  constraint chk_user_invitations_email check (email = lower(btrim(email)))
);

create unique index if not exists uq_user_invitations_email on public.user_invitations (email);

alter table public.user_invitations enable row level security;
revoke all on table public.user_invitations from anon, authenticated;

-- ── Invite ────────────────────────────────────────────────────────────────────

create or replace function public.admin_invite_user(
  p_email     text,
  p_full_name text,
  p_roles     public.app_role[]
)
returns table (status text, user_id uuid, invitation_id uuid)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email   text := lower(btrim(coalesce(p_email, '')));
  v_name    text := nullif(btrim(coalesce(p_full_name, '')), '');
  v_roles   public.app_role[];
  v_user_id uuid;
  v_inv_id  uuid;
  v_org_id  uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden agregar usuarios.' using errcode = 'P0001';
  end if;

  if length(v_email) > 120 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'INVITE_EMAIL_INVALID' using errcode = 'P0001';
  end if;
  if v_name is not null and length(v_name) > 80 then
    raise exception 'INVITE_NAME_INVALID' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(distinct r), '{}') into v_roles from unnest(coalesce(p_roles, '{}')) as r;
  if cardinality(v_roles) = 0 then
    raise exception 'INVITE_ROLES_REQUIRED' using errcode = 'P0001';
  end if;

  -- The email already has an account: nothing to invite
  select u.id into v_user_id from auth.users u where lower(u.email) = v_email limit 1;
  if v_user_id is not null then
    status := 'exists';
    user_id := v_user_id;
    invitation_id := null;
    return next;
    return;
  end if;

  begin
    insert into public.user_invitations (email, full_name, roles, created_by)
    values (v_email, v_name, v_roles, auth.uid())
    returning id into v_inv_id;
  exception when unique_violation then
    raise exception 'INVITE_ALREADY_PENDING' using errcode = 'P0001';
  end;

  -- A professional without account, so they can already be scheduled
  if 'staff' = any (v_roles)
     and not exists (
       select 1 from public.staff_members sm
        where sm.profile_user_id is null and lower(sm.invite_email) = v_email
     ) then
    select o.id into v_org_id from public.organizations o limit 1;
    if v_org_id is not null then
      insert into public.staff_members (organization_id, profile_user_id, display_name, invite_email)
      values (v_org_id, null, coalesce(v_name, nullif(split_part(v_email, '@', 1), ''), 'Profesional'), v_email);
    end if;
  end if;

  status := 'invited';
  user_id := null;
  invitation_id := v_inv_id;
  return next;
end;
$$;

-- ── List / delete ─────────────────────────────────────────────────────────────

create or replace function public.admin_list_user_invitations()
returns table (id uuid, email text, full_name text, roles public.app_role[], created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select i.id, i.email, i.full_name, i.roles, i.created_at
    from public.user_invitations i
   where public.is_admin()
   order by i.created_at desc;
$$;

-- Removes the invitation; the professional created for it is removed too unless it already
-- has appointments (then it stays, without account).
create or replace function public.admin_delete_user_invitation(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = 'P0001';
  end if;

  delete from public.user_invitations i where i.id = p_id returning i.email into v_email;
  if v_email is null then
    raise exception 'INVITE_NOT_FOUND' using errcode = 'P0001';
  end if;

  delete from public.staff_members sm
   where sm.profile_user_id is null
     and lower(sm.invite_email) = v_email
     and not exists (select 1 from public.appointments a where a.staff_member_id = sm.id);
end;
$$;

-- ── Apply at first sign-in ────────────────────────────────────────────────────

create or replace function public.apply_user_invitation_on_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
  v_inv   public.user_invitations%rowtype;
  v_role  public.app_role;
begin
  select lower(u.email) into v_email from auth.users u where u.id = new.user_id;
  if v_email is null then
    return new;
  end if;

  select * into v_inv from public.user_invitations i where i.email = v_email;
  if not found then
    return new;
  end if;

  foreach v_role in array v_inv.roles loop
    insert into public.user_roles (user_id, role, granted_by_user_id)
    select new.user_id, v_role, coalesce(v_inv.created_by, new.user_id)
    where not exists (
      select 1 from public.user_roles ur where ur.user_id = new.user_id and ur.role = v_role
    );
  end loop;

  -- The new account starts as a client; keep that only if the invitation asked for it
  if not ('customer' = any (v_inv.roles)) then
    delete from public.user_roles ur where ur.user_id = new.user_id and ur.role = 'customer';
  end if;

  -- Use the invited name when the account has none yet
  if v_inv.full_name is not null and nullif(btrim(coalesce(new.full_name, '')), '') is null then
    update public.profiles p set full_name = v_inv.full_name where p.user_id = new.user_id;
  end if;

  delete from public.user_invitations i where i.id = v_inv.id;
  return new;
end;
$$;

drop trigger if exists trg_profiles_apply_user_invitation on public.profiles;
create trigger trg_profiles_apply_user_invitation
  after insert on public.profiles
  for each row execute function public.apply_user_invitation_on_profile();

revoke all on function public.admin_invite_user(text, text, public.app_role[]) from public, anon;
revoke all on function public.admin_list_user_invitations() from public, anon;
revoke all on function public.admin_delete_user_invitation(uuid) from public, anon;
grant execute on function public.admin_invite_user(text, text, public.app_role[]) to authenticated;
grant execute on function public.admin_list_user_invitations() to authenticated;
grant execute on function public.admin_delete_user_invitation(uuid) to authenticated;
