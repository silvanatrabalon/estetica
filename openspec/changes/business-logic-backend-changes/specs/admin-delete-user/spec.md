## ADDED Requirements

### Requirement: appointments.created_by_user_id Nullable Migration
The system SHALL apply a migration to drop the `NOT NULL` constraint from `appointments.created_by_user_id`. Existing rows are unaffected. This migration is required before the Edge Function can safely NULL the column during user deletion.

#### Scenario: Migration applied
- **WHEN** the migration runs
- **THEN** `appointments.created_by_user_id` accepts NULL values and existing rows remain valid

#### Scenario: New appointments unaffected
- **WHEN** a new appointment is created after the migration
- **THEN** `created_by_user_id` is still set (not NULL) by the application — the relaxed constraint only enables the deletion path

### Requirement: admin-delete-user Edge Function
The system SHALL provide a Supabase Edge Function at `supabase/functions/admin-delete-user/index.ts`. It SHALL accept a JSON body `{ userId: string }`. It MUST validate the caller's `Authorization` JWT and confirm the caller has the `admin` role before proceeding. On authorization failure it SHALL return HTTP 401. It SHALL execute the following pre-deletion steps in order before calling `supabase.auth.admin.deleteUser(userId)`:
1. Cancel all `pending` and `confirmed` appointments where `customer_user_id = userId`
2. Set `created_by_user_id = NULL` on all appointments where `created_by_user_id = userId`
3. Set `is_active = false` on all `staff_members` rows where `profile_user_id = userId`
4. Call `supabase.auth.admin.deleteUser(userId)` — this cascades deletion of `profiles` and `user_roles` rows and sets `appointments.customer_user_id = NULL`

It SHALL return `{ deletedUserId: string, cancelledAppointments: number }` on success. It MUST include CORS headers required for Supabase Edge Function invocation.

#### Scenario: Successful user deletion
- **WHEN** an admin calls the Edge Function with a valid `userId`
- **THEN** all pre-deletion steps execute in order, `deleteUser` is called, and the function returns `{ deletedUserId, cancelledAppointments }`

#### Scenario: Non-admin caller rejected
- **WHEN** a caller without the `admin` role invokes the Edge Function
- **THEN** the function returns HTTP 401 and no deletion steps are executed

#### Scenario: Missing or invalid JWT
- **WHEN** the `Authorization` header is absent or contains an invalid JWT
- **THEN** the function returns HTTP 401

#### Scenario: Pending and confirmed appointments cancelled before deletion
- **WHEN** the user has 2 pending and 1 confirmed appointment
- **THEN** all 3 are cancelled before `deleteUser` is called; `cancelledAppointments = 3` in the response

#### Scenario: created_by_user_id nulled before deletion
- **WHEN** the user is the `created_by_user_id` on some appointments
- **THEN** those appointments have `created_by_user_id = NULL` after the function completes (no FK violation)

#### Scenario: Staff member deactivated
- **WHEN** the user has an associated `staff_members` row
- **THEN** `is_active` is set to `false` on that row before `deleteUser` is called

#### Scenario: No pre-deletion data for user
- **WHEN** the user has no appointments and no staff rows
- **THEN** the function still calls `deleteUser` and returns `{ deletedUserId, cancelledAppointments: 0 }`

### Requirement: Admin Users Panel — Delete User Action
The system SHALL display an "Eliminar usuario" action in each user row of `/admin/users`. Clicking it SHALL open a confirmation dialog with the copy: *"Esta acción eliminará permanentemente al usuario y su acceso. Sus turnos pasados quedarán sin nombre de cliente."* The dialog SHALL have a "Eliminar" (destructive) and a "Cancelar" button. On confirmation the frontend SHALL call `supabase.functions.invoke('admin-delete-user', { body: { userId } })`. On success a Spanish success message SHALL be shown and the user row SHALL be removed from the list. On error a Spanish error message SHALL be shown.

#### Scenario: Delete user action visible in user row
- **WHEN** an admin views the users list
- **THEN** each user row displays an "Eliminar usuario" action

#### Scenario: Confirmation dialog appears
- **WHEN** the admin clicks "Eliminar usuario" for a user
- **THEN** a confirmation dialog appears with the exact warning copy and "Eliminar" / "Cancelar" buttons

#### Scenario: Cancel closes dialog
- **WHEN** the admin clicks "Cancelar"
- **THEN** the dialog closes and no Edge Function is called

#### Scenario: Successful deletion updates UI
- **WHEN** the admin confirms and the Edge Function returns success
- **THEN** the user row disappears from the list and a Spanish success toast/message is shown

#### Scenario: Deletion error shown in Spanish
- **WHEN** the Edge Function returns an error
- **THEN** a Spanish error message is displayed and the user row remains in the list
