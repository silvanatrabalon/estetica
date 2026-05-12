-- Fix organizations INSERT RLS policy for single-tenant model.
-- In single-tenant, admins should be able to insert the organization record directly.

drop policy if exists organizations_insert_manage_org on public.organizations;
create policy organizations_insert_manage_org
	on public.organizations
	for insert
	to authenticated
	with check (public.is_admin());
