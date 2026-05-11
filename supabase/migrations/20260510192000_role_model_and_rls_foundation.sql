-- Role model and RLS authorization foundation.
-- Introduces canonical app roles, role source of truth, RLS helper functions,
-- and baseline policies for public/authenticated/staff/admin access separation.

create type public.app_role as enum ('customer', 'staff', 'admin');

create table if not exists public.user_roles (
	user_id uuid primary key references auth.users(id) on delete cascade,
	role public.app_role not null default 'customer',
	granted_by_user_id uuid references auth.users(id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_user_roles_role
	on public.user_roles (role);

create index if not exists idx_user_roles_granted_by
	on public.user_roles (granted_by_user_id)
	where granted_by_user_id is not null;

create or replace function public.handle_new_auth_user_role()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
	insert into public.user_roles (user_id, role)
	values (new.id, 'customer')
	on conflict (user_id) do nothing;

	return new;
end;
$$;

drop trigger if exists on_auth_user_created_set_default_role on auth.users;

create trigger on_auth_user_created_set_default_role
	after insert on auth.users
	for each row execute function public.handle_new_auth_user_role();

insert into public.user_roles (user_id, role)
select u.id, 'customer'::public.app_role
from auth.users u
on conflict (user_id) do nothing;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
	select
		case
			when auth.uid() is null then null
			else coalesce(
				(select ur.role from public.user_roles ur where ur.user_id = auth.uid()),
				'customer'::public.app_role
			)
		end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select coalesce(public.current_app_role() = 'admin'::public.app_role, false);
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select coalesce(public.current_app_role() = any (array['staff'::public.app_role, 'admin'::public.app_role]), false);
$$;

create or replace function public.is_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select exists (
		select 1
		from public.organization_memberships om
		where om.organization_id = target_organization_id
			and om.user_id = auth.uid()
	);
$$;

create or replace function public.can_manage_org(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select coalesce(
		public.is_admin()
		or exists (
			select 1
			from public.organization_memberships om
			where om.organization_id = target_organization_id
				and om.user_id = auth.uid()
				and om.role in ('owner', 'admin')
		),
		false
	);
$$;

create or replace function public.can_operate_org(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
	select coalesce(
		public.is_admin()
		or exists (
			select 1
			from public.organization_memberships om
			where om.organization_id = target_organization_id
				and om.user_id = auth.uid()
				and om.role in ('owner', 'admin', 'staff')
		),
		false
	);
$$;

alter table public.user_roles enable row level security;
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.staff_members enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

revoke all on table public.user_roles from anon, authenticated;

-- Allow only explicitly intended table privileges; RLS remains the source of truth.
grant select on table public.organizations, public.staff_members, public.services to anon;
grant select, insert, update, delete on table
	public.organizations,
	public.profiles,
	public.organization_memberships,
	public.staff_members,
	public.services,
	public.appointments,
	public.user_roles
to authenticated;

grant execute on function
	public.current_app_role(),
	public.is_admin(),
	public.is_staff_or_admin(),
	public.is_org_member(uuid),
	public.can_manage_org(uuid),
	public.can_operate_org(uuid)
to anon, authenticated;

-- user_roles policies

drop policy if exists user_roles_select_self_or_admin on public.user_roles;
create policy user_roles_select_self_or_admin
	on public.user_roles
	for select
	to authenticated
	using (user_id = auth.uid() or public.is_admin());

drop policy if exists user_roles_insert_admin_only on public.user_roles;
create policy user_roles_insert_admin_only
	on public.user_roles
	for insert
	to authenticated
	with check (public.is_admin());

drop policy if exists user_roles_update_admin_only on public.user_roles;
create policy user_roles_update_admin_only
	on public.user_roles
	for update
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

drop policy if exists user_roles_delete_admin_only on public.user_roles;
create policy user_roles_delete_admin_only
	on public.user_roles
	for delete
	to authenticated
	using (public.is_admin());

-- organizations policies

drop policy if exists organizations_select_public_read on public.organizations;
create policy organizations_select_public_read
	on public.organizations
	for select
	to anon, authenticated
	using (true);

drop policy if exists organizations_insert_manage_org on public.organizations;
create policy organizations_insert_manage_org
	on public.organizations
	for insert
	to authenticated
	with check (public.can_manage_org(id));

drop policy if exists organizations_update_manage_org on public.organizations;
create policy organizations_update_manage_org
	on public.organizations
	for update
	to authenticated
	using (public.can_manage_org(id))
	with check (public.can_manage_org(id));

drop policy if exists organizations_delete_manage_org on public.organizations;
create policy organizations_delete_manage_org
	on public.organizations
	for delete
	to authenticated
	using (public.can_manage_org(id));

-- profiles policies

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin
	on public.profiles
	for select
	to authenticated
	using (user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_self_or_admin on public.profiles;
create policy profiles_insert_self_or_admin
	on public.profiles
	for insert
	to authenticated
	with check (user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin
	on public.profiles
	for update
	to authenticated
	using (user_id = auth.uid() or public.is_admin())
	with check (user_id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete_admin_only on public.profiles;
create policy profiles_delete_admin_only
	on public.profiles
	for delete
	to authenticated
	using (public.is_admin());

-- organization_memberships policies

drop policy if exists organization_memberships_select_member_or_operator on public.organization_memberships;
create policy organization_memberships_select_member_or_operator
	on public.organization_memberships
	for select
	to authenticated
	using (user_id = auth.uid() or public.can_operate_org(organization_id));

drop policy if exists organization_memberships_insert_manage_org on public.organization_memberships;
create policy organization_memberships_insert_manage_org
	on public.organization_memberships
	for insert
	to authenticated
	with check (public.can_manage_org(organization_id));

drop policy if exists organization_memberships_update_manage_org on public.organization_memberships;
create policy organization_memberships_update_manage_org
	on public.organization_memberships
	for update
	to authenticated
	using (public.can_manage_org(organization_id))
	with check (public.can_manage_org(organization_id));

drop policy if exists organization_memberships_delete_manage_org on public.organization_memberships;
create policy organization_memberships_delete_manage_org
	on public.organization_memberships
	for delete
	to authenticated
	using (public.can_manage_org(organization_id));

-- staff_members policies

drop policy if exists staff_members_select_public_active_or_operator on public.staff_members;
create policy staff_members_select_public_active_or_operator
	on public.staff_members
	for select
	to anon, authenticated
	using (is_active or public.can_operate_org(organization_id));

drop policy if exists staff_members_insert_operate_org on public.staff_members;
create policy staff_members_insert_operate_org
	on public.staff_members
	for insert
	to authenticated
	with check (public.can_operate_org(organization_id));

drop policy if exists staff_members_update_operate_org on public.staff_members;
create policy staff_members_update_operate_org
	on public.staff_members
	for update
	to authenticated
	using (public.can_operate_org(organization_id))
	with check (public.can_operate_org(organization_id));

drop policy if exists staff_members_delete_manage_org on public.staff_members;
create policy staff_members_delete_manage_org
	on public.staff_members
	for delete
	to authenticated
	using (public.can_manage_org(organization_id));

-- services policies

drop policy if exists services_select_public_active_or_operator on public.services;
create policy services_select_public_active_or_operator
	on public.services
	for select
	to anon, authenticated
	using (is_active or public.can_operate_org(organization_id));

drop policy if exists services_insert_operate_org on public.services;
create policy services_insert_operate_org
	on public.services
	for insert
	to authenticated
	with check (public.can_operate_org(organization_id));

drop policy if exists services_update_operate_org on public.services;
create policy services_update_operate_org
	on public.services
	for update
	to authenticated
	using (public.can_operate_org(organization_id))
	with check (public.can_operate_org(organization_id));

drop policy if exists services_delete_manage_org on public.services;
create policy services_delete_manage_org
	on public.services
	for delete
	to authenticated
	using (public.can_manage_org(organization_id));

-- appointments policies

drop policy if exists appointments_select_customer_staff_admin on public.appointments;
create policy appointments_select_customer_staff_admin
	on public.appointments
	for select
	to authenticated
	using (
		public.is_admin()
		or customer_user_id = auth.uid()
		or created_by_user_id = auth.uid()
		or exists (
			select 1
			from public.staff_members sm
			where sm.id = appointments.staff_member_id
				and sm.profile_user_id = auth.uid()
		)
		or public.can_operate_org(organization_id)
	);

drop policy if exists appointments_insert_customer_staff_admin on public.appointments;
create policy appointments_insert_customer_staff_admin
	on public.appointments
	for insert
	to authenticated
	with check (
		public.is_admin()
		or public.can_operate_org(organization_id)
		or (
			customer_user_id = auth.uid()
			and created_by_user_id = auth.uid()
		)
	);

drop policy if exists appointments_update_customer_staff_admin on public.appointments;
create policy appointments_update_customer_staff_admin
	on public.appointments
	for update
	to authenticated
	using (
		public.is_admin()
		or public.can_operate_org(organization_id)
		or customer_user_id = auth.uid()
		or created_by_user_id = auth.uid()
	)
	with check (
		public.is_admin()
		or public.can_operate_org(organization_id)
		or customer_user_id = auth.uid()
		or created_by_user_id = auth.uid()
	);

drop policy if exists appointments_delete_admin_only on public.appointments;
create policy appointments_delete_admin_only
	on public.appointments
	for delete
	to authenticated
	using (public.is_admin() or public.can_manage_org(organization_id));
