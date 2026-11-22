-- Professionals without an account.
--
-- A professional can be created with just a name (and optionally an email), the same way a
-- booking can be made for a person without an account. Later the admin can link them to an
-- account, or the link happens by itself: when someone signs in for the first time with the
-- email that was saved on the professional, they are linked and given the staff role (this
-- works as an invitation: they only need to sign in with that email).
--
--  * staff_members.invite_email holds that email while the professional has no account;
--  * admin_create_staff_without_account creates one (links right away if the email already
--    belongs to an account);
--  * admin_link_staff_member links an existing professional to an account;
--  * admin_rename_staff_member renames a professional that has no account (linked ones take
--    the name of their account);
--  * a trigger on profiles links invited people the first time they sign in;
--  * admin_list_staff_members also returns invite_email.

alter table public.staff_members
  add column if not exists invite_email text;

create unique index if not exists uq_staff_members_invite_email
  on public.staff_members (lower(invite_email))
  where profile_user_id is null and invite_email is not null;

-- ── List (adds invite_email) ──────────────────────────────────────────────────

drop function if exists public.admin_list_staff_members();

create or replace function public.admin_list_staff_members()
returns table (
  id uuid,
  organization_id uuid,
  profile_user_id uuid,
  display_name text,
  is_active boolean,
  created_at timestamptz,
  full_name text,
  role public.app_role,
  invite_email text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    sm.id,
    sm.organization_id,
    sm.profile_user_id,
    sm.display_name,
    sm.is_active,
    sm.created_at,
    p.full_name,
    'staff'::public.app_role as role,
    sm.invite_email
  from public.staff_members sm
  left join public.profiles p on p.user_id = sm.profile_user_id
  where public.is_admin()
    and (
      sm.profile_user_id is null
      or exists (
        select 1 from public.user_roles ur
        where ur.user_id = sm.profile_user_id
          and ur.role = 'staff'
      )
    )
  order by sm.created_at asc;
$$;

grant execute on function public.admin_list_staff_members() to authenticated;

-- ── Link a professional to an account ─────────────────────────────────────────

create or replace function public.admin_link_staff_member(p_staff_id uuid, p_user_id uuid)
returns table (
  id uuid,
  organization_id uuid,
  profile_user_id uuid,
  display_name text,
  is_active boolean,
  created_at timestamptz,
  full_name text,
  role public.app_role,
  invite_email text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_staff public.staff_members%rowtype;
  v_name  text;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden vincular profesionales.' using errcode = 'P0001';
  end if;

  select * into v_staff from public.staff_members sm where sm.id = p_staff_id for update;
  if not found then
    raise exception 'STAFF_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_staff.profile_user_id is not null then
    raise exception 'STAFF_ALREADY_LINKED' using errcode = 'P0001';
  end if;

  if not exists (select 1 from auth.users u where u.id = p_user_id) then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.staff_members sm where sm.profile_user_id = p_user_id) then
    raise exception 'STAFF_USER_TAKEN' using errcode = 'P0001';
  end if;

  select coalesce(
           nullif(btrim(p.full_name), ''),
           nullif(split_part(u.email, '@', 1), ''),
           v_staff.display_name
         )
    into v_name
    from auth.users u
    left join public.profiles p on p.user_id = u.id
   where u.id = p_user_id;

  update public.staff_members sm
     set profile_user_id = p_user_id,
         invite_email = null,
         display_name = coalesce(v_name, sm.display_name),
         updated_at = now()
   where sm.id = p_staff_id;

  insert into public.user_roles (user_id, role, granted_by_user_id)
  select p_user_id, 'staff'::public.app_role, auth.uid()
  where not exists (
    select 1 from public.user_roles ur
     where ur.user_id = p_user_id and ur.role = 'staff'::public.app_role
  );

  return query
    select sm.id, sm.organization_id, sm.profile_user_id, sm.display_name, sm.is_active,
           sm.created_at, p.full_name, 'staff'::public.app_role, sm.invite_email
      from public.staff_members sm
      left join public.profiles p on p.user_id = sm.profile_user_id
     where sm.id = p_staff_id;
end;
$$;

-- ── Create a professional without an account ──────────────────────────────────

create or replace function public.admin_create_staff_without_account(
  p_display_name text,
  p_email        text default null
)
returns table (
  id uuid,
  organization_id uuid,
  profile_user_id uuid,
  display_name text,
  is_active boolean,
  created_at timestamptz,
  full_name text,
  role public.app_role,
  invite_email text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_name    text := btrim(coalesce(p_display_name, ''));
  v_email   text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_org_id  uuid;
  v_user_id uuid;
  v_new_id  uuid;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden crear profesionales.' using errcode = 'P0001';
  end if;

  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'STAFF_NAME_INVALID' using errcode = 'P0001';
  end if;
  if v_email is not null and (length(v_email) > 120 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'STAFF_EMAIL_INVALID' using errcode = 'P0001';
  end if;

  select o.id into v_org_id from public.organizations o limit 1;
  if v_org_id is null then
    raise exception 'No se encontró la organización.';
  end if;

  -- That email already has an account: link right away
  if v_email is not null then
    select u.id into v_user_id from auth.users u where lower(u.email) = v_email limit 1;
    if v_user_id is not null then
      if exists (select 1 from public.staff_members sm where sm.profile_user_id = v_user_id) then
        raise exception 'STAFF_USER_TAKEN' using errcode = 'P0001';
      end if;

      insert into public.staff_members (organization_id, profile_user_id, display_name)
      values (v_org_id, v_user_id, v_name)
      returning staff_members.id into v_new_id;

      return query select * from public.admin_link_staff_member_internal(v_new_id, v_user_id);
      return;
    end if;
  end if;

  begin
    insert into public.staff_members (organization_id, profile_user_id, display_name, invite_email)
    values (v_org_id, null, v_name, v_email)
    returning staff_members.id into v_new_id;
  exception when unique_violation then
    raise exception 'STAFF_INVITE_EMAIL_TAKEN' using errcode = 'P0001';
  end;

  return query
    select sm.id, sm.organization_id, sm.profile_user_id, sm.display_name, sm.is_active,
           sm.created_at, null::text, 'staff'::public.app_role, sm.invite_email
      from public.staff_members sm
     where sm.id = v_new_id;
end;
$$;

-- Used when the email already belongs to an account: name from the account + staff role
create or replace function public.admin_link_staff_member_internal(p_staff_id uuid, p_user_id uuid)
returns table (
  id uuid,
  organization_id uuid,
  profile_user_id uuid,
  display_name text,
  is_active boolean,
  created_at timestamptz,
  full_name text,
  role public.app_role,
  invite_email text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update public.staff_members sm
     set display_name = coalesce(
           (select coalesce(nullif(btrim(p.full_name), ''), nullif(split_part(u.email, '@', 1), ''))
              from auth.users u left join public.profiles p on p.user_id = u.id
             where u.id = p_user_id),
           sm.display_name),
         updated_at = now()
   where sm.id = p_staff_id;

  insert into public.user_roles (user_id, role, granted_by_user_id)
  select p_user_id, 'staff'::public.app_role, auth.uid()
  where not exists (
    select 1 from public.user_roles ur
     where ur.user_id = p_user_id and ur.role = 'staff'::public.app_role
  );

  return query
    select sm.id, sm.organization_id, sm.profile_user_id, sm.display_name, sm.is_active,
           sm.created_at, p.full_name, 'staff'::public.app_role, sm.invite_email
      from public.staff_members sm
      left join public.profiles p on p.user_id = sm.profile_user_id
     where sm.id = p_staff_id;
end;
$$;

-- ── Rename a professional that has no account ─────────────────────────────────

create or replace function public.admin_rename_staff_member(p_staff_id uuid, p_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_display_name, ''));
begin
  if not public.is_admin() then
    raise exception 'No autorizado: solo administradores pueden editar profesionales.' using errcode = 'P0001';
  end if;
  if length(v_name) < 2 or length(v_name) > 80 then
    raise exception 'STAFF_NAME_INVALID' using errcode = 'P0001';
  end if;

  update public.staff_members sm
     set display_name = v_name, updated_at = now()
   where sm.id = p_staff_id and sm.profile_user_id is null;

  if not found then
    raise exception 'STAFF_NAME_FROM_ACCOUNT' using errcode = 'P0001';
  end if;
end;
$$;

-- ── Invitation by email: link the first time that person signs in ─────────────

create or replace function public.link_invited_staff_on_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_staff_id uuid;
  v_email    text;
begin
  select lower(u.email) into v_email from auth.users u where u.id = new.user_id;
  if v_email is null then
    return new;
  end if;

  select sm.id into v_staff_id
    from public.staff_members sm
   where sm.profile_user_id is null
     and sm.invite_email is not null
     and lower(sm.invite_email) = v_email
   limit 1;

  if v_staff_id is null
     or exists (select 1 from public.staff_members x where x.profile_user_id = new.user_id) then
    return new;
  end if;

  update public.staff_members sm
     set profile_user_id = new.user_id,
         invite_email = null,
         display_name = coalesce(nullif(btrim(new.full_name), ''), sm.display_name),
         updated_at = now()
   where sm.id = v_staff_id;

  insert into public.user_roles (user_id, role, granted_by_user_id)
  select new.user_id, 'staff'::public.app_role, new.user_id
  where not exists (
    select 1 from public.user_roles ur
     where ur.user_id = new.user_id and ur.role = 'staff'::public.app_role
  );

  return new;
end;
$$;

drop trigger if exists trg_profiles_link_invited_staff on public.profiles;
create trigger trg_profiles_link_invited_staff
  after insert on public.profiles
  for each row execute function public.link_invited_staff_on_profile();

revoke all on function public.admin_link_staff_member(uuid, uuid) from public, anon;
revoke all on function public.admin_create_staff_without_account(text, text) from public, anon;
revoke all on function public.admin_link_staff_member_internal(uuid, uuid) from public, anon, authenticated;
revoke all on function public.admin_rename_staff_member(uuid, text) from public, anon;
grant execute on function public.admin_link_staff_member(uuid, uuid) to authenticated;
grant execute on function public.admin_create_staff_without_account(text, text) to authenticated;
grant execute on function public.admin_rename_staff_member(uuid, text) to authenticated;
