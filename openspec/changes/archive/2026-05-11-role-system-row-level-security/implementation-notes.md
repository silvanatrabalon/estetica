## Policy Naming Conventions

- Use `{table}_{action}_{scope}` naming format for all RLS policies.
- Keep action names explicit: `select`, `insert`, `update`, `delete`.
- Keep scope names role-aware and behavior-based (for example: `public_read`, `operate_org`, `admin_only`).
- Keep policy names stable across iterations; modify policy definition before renaming unless semantics materially change.

## Grant and Revoke Workflow

1. Revoke broad access from `anon` and `authenticated` by default for newly introduced role-protected tables.
2. Grant table operation privileges (`select`, `insert`, `update`, `delete`) only where needed by runtime roles.
3. Enforce real access boundaries in RLS policies, not in grants.
4. Grant execution on helper functions used in RLS expressions to roles that evaluate those policies (`anon` and/or `authenticated`).
5. Validate that role escalation operations (role grants/revokes) remain admin-only via policy checks.

## Rollout Notes

1. Apply migration in staging and run role matrix validation scenarios from `supabase/tests/role_rls_matrix.sql`.
2. Verify `customer`, `staff`, and `admin` role behavior for read/write across public and sensitive tables.
3. Confirm default role bootstrap by creating a new authenticated user and checking `public.user_roles`.
4. Confirm no regressions in existing auth/session flow from the frontend.
5. Deploy migration to production only after staging validation passes.

## Rollback Notes

- Primary rollback path: revert this migration and redeploy prior schema state.
- Incident mitigation path: temporarily relax only non-sensitive read policies while keeping admin/staff write protections intact.
- Preserve data in `public.user_roles`; do not destructive-delete role mappings during emergency rollback unless absolutely necessary.

## Role Grant/Revoke Operational Flow (MVP)

- Role grants:
  - Admin updates `public.user_roles.role` for a target `user_id`.
  - `granted_by_user_id` should be set by operational tooling when grant UI/workflow is introduced.
- Role revokes/downgrades:
  - Admin sets `role` to the intended lower privilege role (`staff` -> `customer`, `admin` -> `staff`/`customer`).
- Auditing (interim):
  - Use `created_at` and `updated_at` in `public.user_roles` plus migration history until a dedicated audit log capability is added.
