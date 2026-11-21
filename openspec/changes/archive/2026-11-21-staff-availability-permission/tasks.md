## 1. Database

- [x] 1.1 Migration `20260521400000_staff_availability_permission.sql`: column, read RPC, guard, admin RPCs
- [x] 1.2 Recreate the three self-service write RPCs behind the guard
- [x] 1.3 Apply to production and verify blocked / allowed / admin cases

## 2. Frontend

- [x] 2.1 Services: `getMyAvailabilityPermission`, `listStaffAvailabilityPermissions`, `adminSetStaffAvailabilityPermission`
- [x] 2.2 `useMyStaffAvailability` exposes `canEdit`
- [x] 2.3 `readOnly` mode for `WeeklyScheduleEditor` and `ExceptionDateList`; notice on `StaffSchedulePage`
- [x] 2.4 Checkbox per professional in `AdminStaffPage` with optimistic update and revert on error

## 3. Tests

- [x] 3.1 Service tests: fail-open on lookup error, mapping, error propagation
- [x] 3.2 Page tests: read-only view, notice, hidden save/delete/exception form, still lists exceptions
- [x] 3.3 Admin page tests: reflects state, saves, reverts on failure, hidden when unknown
- [x] 3.4 Component tests for `readOnly`
