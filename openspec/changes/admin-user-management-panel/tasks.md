## 1. Scope And Data Contracts

- [x] 1.1 Confirm and document admin user listing source to include authenticated users with and without profile rows
- [x] 1.2 Define MVP analytics contract for total users, active vs inactive, role distribution, and last-30-day signups
- [x] 1.3 Define explicit backend invariants for self-demotion prevention and last-admin lockout prevention

## 2. Backend Authorization And Lifecycle

- [x] 2.1 Implement admin-only role mutation path for canonical global roles (`customer`, `staff`, `admin`)
- [x] 2.2 Implement reversible global user deactivation/reactivation behavior aligned with access-block semantics
- [x] 2.3 Enforce non-admin denial paths for role/deactivation mutations through RLS-safe data access patterns

## 3. Frontend Admin Panel Flows

- [x] 3.1 Extend `/admin/users` to render deterministic loading, empty, success, and recoverable error states
- [x] 3.2 Implement admin role change workflow with explicit confirmation and post-action feedback in Spanish
- [x] 3.3 Implement admin deactivate/reactivate workflow with explicit confirmation and state-consistent feedback in Spanish
- [x] 3.4 Add lightweight analytics summary block in `/admin/users` for agreed MVP KPIs

## 4. Validation And Regression Safety

- [x] 4.1 Add unit tests for role/deactivation action policies and critical safety invariants
- [x] 4.2 Add integration tests for admin flows (list users, role changes, deactivate/reactivate) and non-admin denial behavior
- [x] 4.3 Add SQL smoke/RLS tests for admin-allowed and non-admin-denied user management mutations
- [x] 4.4 Run targeted regression tests to ensure prior basic admin profile editing and route-guard behavior remain correct

## 5. Completion And Tracking

- [x] 5.1 Verify implemented behavior against all `admin-user-management-panel` scenarios
- [ ] 5.2 Update backlog tracking with change name and implementation commit reference when complete
