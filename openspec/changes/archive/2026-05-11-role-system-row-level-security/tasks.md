## 1. Role Model Foundation

- [x] 1.1 Add a new Supabase migration that introduces canonical role definitions (`customer`, `staff`, `admin`) and a normalized role assignment structure keyed to authenticated users.
- [x] 1.2 Add constraints and indexes to guarantee valid role values and efficient role lookup for policy evaluation.
- [x] 1.3 Implement deterministic default role assignment (`customer`) for authenticated users without an existing role mapping, including backfill handling for current users.

## 2. Policy Helpers and RLS Baseline

- [x] 2.1 Add SQL helper function(s) to resolve the current authenticated user role for policy checks.
- [x] 2.2 Enable RLS on target role-protected tables and apply deny-by-default policy posture where no explicit allow policy exists.
- [x] 2.3 Add public-read policies only for explicitly public tables and ensure sensitive/operational tables deny unauthenticated access.

## 3. Role-Aware Access Policies

- [x] 3.1 Add customer-scoped policies that allow only non-privileged authenticated behavior required for MVP flows.
- [x] 3.2 Add staff-scoped policies for operational actions and verify they do not grant admin-only operations.
- [x] 3.3 Add admin-only policies for privileged management operations.

## 4. Integration and Verification

- [x] 4.1 Update Supabase-facing auth/session access layer to align with database role model assumptions (source-of-truth role resolution).
- [x] 4.2 Validate role matrix behavior with SQL-based test scenarios for unauthenticated, customer, staff, and admin contexts across select/insert/update/delete operations.
- [x] 4.3 Document policy naming conventions, grant/revoke operational workflow, and migration rollout/rollback notes for this change.
