## 1. Database — Tables Migration

- [x] 1.1 Create migration `YYYYMMDD_staff_availability_tables.sql`
- [x] 1.2 Define `staff_schedules` table: `id`, `staff_member_id` (FK → `staff_members`), `day_of_week` (0–6), `is_working` boolean, `starts_at` time, `ends_at` time, `created_at`, `updated_at`
- [x] 1.3 Add CHECK constraint: when `is_working = true`, `starts_at` and `ends_at` must be non-null and `starts_at < ends_at`; when `is_working = false`, both must be null
- [x] 1.4 Add UNIQUE constraint `(staff_member_id, day_of_week)` on `staff_schedules`
- [x] 1.5 Add index `idx_staff_schedules_staff_member_id` on `staff_schedules (staff_member_id)`
- [x] 1.6 Add partial index `idx_staff_schedules_working` on `staff_schedules (staff_member_id, day_of_week) WHERE is_working = true`
- [x] 1.7 Define `staff_schedule_exceptions` table: `id`, `staff_member_id` (FK → `staff_members`), `exception_date` date, `exception_type` text (`day_off` | `custom_hours`), `starts_at` time, `ends_at` time, `reason` text, `created_at`, `updated_at`
- [x] 1.8 Add CHECK constraint: when `exception_type = 'day_off'`, times must be null; when `exception_type = 'custom_hours'`, times must be non-null and `starts_at < ends_at`
- [x] 1.9 Add UNIQUE constraint `(staff_member_id, exception_date)` on `staff_schedule_exceptions`
- [x] 1.10 Add index `idx_staff_schedule_exceptions_staff_date` on `staff_schedule_exceptions (staff_member_id, exception_date)`
- [x] 1.11 Enable RLS on both tables
- [x] 1.12 Grant SELECT on both tables to `authenticated` (no INSERT/UPDATE/DELETE)
- [x] 1.13 Create RLS policy: authenticated SELECT on `staff_schedules` using `true`
- [x] 1.14 Create RLS policy: authenticated SELECT on `staff_schedule_exceptions` using `true`

## 2. Database — RPC Functions Migration

- [x] 2.1 Create migration `YYYYMMDD_staff_availability_rpc.sql`
- [x] 2.2 Create `admin_set_staff_schedule(p_staff_member_id uuid, p_schedule jsonb)` SECURITY DEFINER: validate caller is admin, delete all existing rows for staff member, bulk insert the 7-day schedule array atomically, return inserted rows
- [x] 2.3 Create `admin_upsert_staff_schedule_exception(p_staff_member_id uuid, p_exception_date date, p_exception_type text, p_starts_at time, p_ends_at time, p_reason text)` SECURITY DEFINER: validate caller is admin, upsert on `(staff_member_id, exception_date)` conflict, return the upserted row
- [x] 2.4 Create `admin_delete_staff_schedule_exception(p_staff_member_id uuid, p_exception_date date)` SECURITY DEFINER: validate caller is admin, delete the matching exception, return deleted row id
- [x] 2.5 Apply both migrations to remote with `npx supabase db push`

## 3. Service Layer

- [x] 3.1 Create `src/services/staffAvailability.ts`
- [x] 3.2 Implement `getStaffWeeklySchedule(staffId: string)` — SELECT from `staff_schedules` where `staff_member_id = staffId` ordered by `day_of_week`
- [x] 3.3 Implement `setStaffWeeklySchedule(staffId: string, schedule: StaffScheduleDay[])` — call `admin_set_staff_schedule` RPC
- [x] 3.4 Implement `listStaffExceptions(staffId: string)` — SELECT from `staff_schedule_exceptions` where `staff_member_id = staffId` ordered by `exception_date`
- [x] 3.5 Implement `addStaffException(staffId: string, exception: StaffExceptionInput)` — call `admin_upsert_staff_schedule_exception` RPC
- [x] 3.6 Implement `removeStaffException(staffId: string, exceptionDate: string)` — call `admin_delete_staff_schedule_exception` RPC
- [x] 3.7 Export all functions and types from `src/services/index.ts`

## 4. Hook

- [x] 4.1 Create `src/hooks/useStaffAvailability.ts`
- [x] 4.2 Implement hook accepting `staffId: string`
- [x] 4.3 Load weekly schedule and exceptions on mount
- [x] 4.4 Expose `schedule`, `exceptions`, `isLoading`, `isSaving`, `errorMessage`, `successMessage`
- [x] 4.5 Implement `saveSchedule(days: StaffScheduleDay[])` — calls service, updates state, sets feedback
- [x] 4.6 Implement `addException(exception: StaffExceptionInput)` — calls service, refreshes exceptions list, sets feedback
- [x] 4.7 Implement `removeException(exceptionDate: string)` — calls service, refreshes exceptions list, sets feedback
- [x] 4.8 Track dirty state: `isDirty` becomes true when schedule is edited but not yet saved
- [x] 4.9 Export hook from `src/hooks/index.ts`

## 5. UI Components

- [x] 5.1 Create `src/components/availability/TimeRangeInput.tsx` — start/end time pair inputs with 30-min step, validates `starts_at < ends_at`, shows error in Spanish
- [x] 5.2 Create `src/components/availability/DayScheduleRow.tsx` — one row: day label (Spanish short name), toggle for `is_working`, conditional `TimeRangeInput`
- [x] 5.3 Create `src/components/availability/WeeklyScheduleEditor.tsx` — renders 7 `DayScheduleRow` components, "Guardar horario" submit button, dirty-state indicator
- [x] 5.4 Create `src/components/availability/ExceptionDateForm.tsx` — date picker, exception type selector (`day_off` / `custom_hours`), conditional `TimeRangeInput` for custom hours, "Agregar" submit
- [x] 5.5 Create `src/components/availability/ExceptionDateList.tsx` — scrollable list of existing exceptions, each row shows date, type, times (if any), and "Eliminar" button
- [x] 5.6 Export all availability components from `src/components/index.ts`

## 6. Page and Routing

- [x] 6.1 Create `src/pages/StaffAvailabilityPage.tsx` — page shell, loads staff member name via existing staff service, uses `useStaffAvailability`, renders `WeeklyScheduleEditor` + `ExceptionDateForm` + `ExceptionDateList`
- [x] 6.2 Add loading state: "Cargando disponibilidad..."
- [x] 6.3 Add breadcrumb / back link: "← Volver a profesionales"
- [x] 6.4 Add unsaved changes banner when `isDirty` is true
- [x] 6.5 Export `StaffAvailabilityPage` from `src/pages/index.ts`
- [x] 6.6 Register route `/admin/staff/:staffId/availability` in `src/App.tsx` wrapped in `<RoleGuard roles={['admin']}>`
- [x] 6.7 Add route entry to route access matrix in `src/lib/routing.ts`
- [x] 6.8 Add "Disponibilidad" action button to each staff row in `AdminStaffPage` linking to the availability route

## 7. Unit Tests

- [x] 7.1 Create `src/components/availability/TimeRangeInput.test.tsx` — validates start < end, boundary cases
- [x] 7.2 Create `src/components/availability/WeeklyScheduleEditor.test.tsx` — at least one working day required, dirty state, save button state
- [x] 7.3 Create `src/components/availability/ExceptionDateForm.test.tsx` — duplicate date rejection, custom_hours requires times, day_off clears times
- [x] 7.4 Create `src/hooks/useStaffAvailability.test.ts` — loading state, saveSchedule success/error, addException success/error, removeException success/error, isDirty state transitions

## 8. Integration Tests

- [x] 8.1 Create `src/pages/StaffAvailabilityPage.test.tsx`
- [x] 8.2 Test: admin can load availability page and see weekly schedule
- [x] 8.3 Test: admin can edit and save weekly schedule
- [x] 8.4 Test: admin can add a day_off exception
- [x] 8.5 Test: admin can add a custom_hours exception
- [x] 8.6 Test: admin can remove an exception
- [x] 8.7 Test: dirty-state banner appears when schedule is modified but not saved
- [x] 8.8 Test: non-admin access is denied via RoleGuard (redirects to /unauthorized)

## 9. SQL Smoke / RLS Tests

- [x] 9.1 Add test: authenticated non-admin SELECT on `staff_schedules` succeeds
- [x] 9.2 Add test: authenticated non-admin SELECT on `staff_schedule_exceptions` succeeds
- [x] 9.3 Add test: authenticated non-admin direct INSERT into `staff_schedules` is denied
- [x] 9.4 Add test: authenticated non-admin direct INSERT into `staff_schedule_exceptions` is denied
- [x] 9.5 Add test: admin calling `admin_set_staff_schedule` with valid data succeeds
- [x] 9.6 Add test: non-admin calling `admin_set_staff_schedule` raises permission error
- [x] 9.7 Add test: admin calling `admin_upsert_staff_schedule_exception` succeeds
- [x] 9.8 Add test: non-admin calling `admin_upsert_staff_schedule_exception` raises permission error
- [x] 9.9 Add test: admin calling `admin_delete_staff_schedule_exception` succeeds
- [x] 9.10 Add test: inserting working day with null `starts_at` violates check constraint
- [x] 9.11 Add test: inserting `day_off` exception with times violates check constraint

## 10. Final Validation

- [x] 10.1 Run full test suite and confirm all tests pass
- [x] 10.2 Manually verify availability page in browser: load, edit weekly template, add/remove exception
- [x] 10.3 Verify route guard: non-admin session cannot access `/admin/staff/:id/availability`
- [x] 10.4 Confirm migrations applied to remote Supabase with `npx supabase db push`
