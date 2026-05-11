-- Allow users to insert their own role record
-- This fixes the issue where the trigger may not execute or fails

-- Replace the insert policy to allow users to insert their own role
drop policy if exists user_roles_insert_admin_only on public.user_roles;

create policy user_roles_insert_allow_self_or_admin
	on public.user_roles
	for insert
	to authenticated
	with check (
		-- Allow admins to insert any role
		public.is_admin()
		-- OR allow users to insert their own role (only 'customer' for safety)
		or (user_id = auth.uid() and role = 'customer'::public.app_role)
	);
