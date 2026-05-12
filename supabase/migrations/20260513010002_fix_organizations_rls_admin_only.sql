-- Fix organizations RLS policy for single-tenant model.
-- In single-tenant, admins should be able to manage the organizations table directly.

drop policy if exists organizations_update_manage_org on public.organizations;
create policy organizations_update_manage_org
	on public.organizations
	for update
	to authenticated
	using (public.is_admin())
	with check (public.is_admin());

drop policy if exists organizations_delete_manage_org on public.organizations;
create policy organizations_delete_manage_org
	on public.organizations
	for delete
	to authenticated
	using (public.is_admin());
