## Why

Professionals could always edit their own weekly schedule and exception dates. Business owners need to decide, per professional, whether that freedom is granted or whether only the admin defines the schedule.

## What Changes

- New per-professional flag `staff_members.can_edit_own_availability` (default `true`, so existing professionals keep today's behavior).
- The self-service write RPCs (`staff_set_my_schedule`, `staff_upsert_my_exception`, `staff_delete_my_exception`) reject the call when the flag is off, so the rule holds even if the UI is bypassed. Admins are never blocked.
- New RPCs: `get_my_availability_permission()`, `admin_list_staff_availability_permissions()`, `admin_set_staff_availability_permission()`.
- **Profesionales** (admin): a checkbox "Puede editar su propia disponibilidad" on each professional.
- **Mi disponibilidad** (professional): when not allowed, a notice and a read-only view (no save button, no exception form, no delete buttons).

## Capabilities

### New Capabilities
- `staff-self-availability`: per-professional permission to edit one's own availability

## User Flow

1. Admin opens Profesionales and unticks "Puede editar su propia disponibilidad" for a professional.
2. The professional opens Mi disponibilidad and sees their schedule with the notice "Tu administrador define tus horarios. Podés verlos acá, pero no modificarlos."
3. Admin can still edit that professional's availability from the Disponibilidad button.
4. Ticking the box again restores editing immediately.

## Data Model

`staff_members.can_edit_own_availability boolean not null default true`. No data migration needed.

## Acceptance Criteria

- With the flag off, the three self-service write RPCs fail with a Spanish permission error; with it on, they behave as before.
- Admins can always use the self-service RPCs and the admin availability RPCs.
- The professional's page is read-only when the flag is off and fully editable when on.
- The permission lookup failing on the professional's page does not block them: the server still enforces the rule.
- If permissions cannot be loaded in Profesionales, the checkbox is hidden instead of breaking the page.
