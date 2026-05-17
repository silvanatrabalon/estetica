## ADDED Requirements

### Requirement: reschedule_appointment can be triggered from calendar drag-and-drop
The `reschedule_appointment` RPC (unchanged from #21) SHALL also be invoked from the calendar drag-and-drop flow initiated in `WeeklyCalendar`. When a user drops an appointment onto a new day and selects a slot in `SlotPickerModal`, the same `reschedule_appointment` function MUST be called with the same authorization and validation rules as the existing `/appointments/:id/reschedule` route. No changes to the RPC signature or behavior are required.

#### Scenario: DnD flow calls reschedule_appointment with correct arguments
- **WHEN** a user drops an appointment on a new day and selects a slot in the modal
- **THEN** `rescheduleAppointment(appointmentId, selectedSlot.starts_at)` is called with the same semantics as the route-based reschedule

#### Scenario: Conflict from DnD reschedule shows Spanish error in modal
- **WHEN** `reschedule_appointment` raises a conflict error during a DnD-initiated reschedule
- **THEN** an inline Spanish error is shown inside `SlotPickerModal`

#### Scenario: Admin DnD bypasses customer policy window
- **WHEN** an admin drags any appointment in the admin calendar and selects a slot within the customer policy window
- **THEN** the reschedule proceeds (admin bypasses `booking_min_notice_minutes` check per existing RPC behavior)
