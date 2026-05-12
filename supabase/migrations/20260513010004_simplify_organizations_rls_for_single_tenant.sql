-- Fix organizations RLS for single-tenant: allow authenticated users to manage singleton
-- In single-tenant, any authenticated user can read the one organizations record
-- and staff/admins can update it.

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
	with check (true);

drop policy if exists organizations_update_manage_org on public.organizations;
create policy organizations_update_manage_org
	on public.organizations
	for update
	to authenticated
	using (true)
	with check (true);

drop policy if exists organizations_delete_manage_org on public.organizations;
create policy organizations_delete_manage_org
	on public.organizations
	for delete
	to authenticated
	using (true);
