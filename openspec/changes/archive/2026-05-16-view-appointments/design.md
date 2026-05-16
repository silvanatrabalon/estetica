## Context

Appointments are the core data object in this app. Post-booking, customers have no persistent way to see their schedule — only a one-time confirmation page. Staff similarly lack a view of their assigned work. This design delivers both.

The existing `get_appointment` RPC (from #19) established the SECURITY DEFINER pattern for appointment reads — `list_appointments` follows the same approach. The frontend builds on the `useUser` and `useSession` hook patterns already in place. Calendar UI is implemented from scratch using CSS Grid (no third-party calendar library) to avoid bloat in the MVP.

## Goals / Non-Goals

**Goals:**
- Deliver a role-aware `list_appointments()` RPC that returns appointments with all necessary join data in a single call
- Implement `AppointmentsPage` (customer) and `StaffAppointmentsPage` (staff) with tabbed list + calendar
- Keep the calendar read-only and purely presentational in this item
- Reuse `formatSlotTime` and existing routing/guard patterns

**Non-Goals:**
- Drag-and-drop reschedule → deferred to #25
- Admin appointment view → separate item #23
- Status filter controls on the list → post-MVP
- Pagination → post-MVP (200-row hard limit is sufficient for MVP)
- iCal / Google Calendar export

## Decisions

### 1. SECURITY DEFINER RPC instead of direct table SELECT
**Decision**: `list_appointments()` is a SECURITY DEFINER function, not a direct authenticated SELECT on the `appointments` table.

**Rationale**: Customers must see `staff_members.display_name` and `profiles.full_name` (for staff to see customer names), but neither table should have broad SELECT grants to the `authenticated` role. This is consistent with the `get_appointment` pattern already in production. A single RPC call also avoids multiple round-trips for the joins.

**Alternative considered**: Direct SELECT with RLS + explicit FK column grants. Rejected because it requires granting column-level SELECT on `staff_members` and `profiles` to `authenticated`, which widens the attack surface and is inconsistent with the established pattern.

### 2. Role awareness inside the RPC (no `p_role` param)
**Decision**: The function determines the caller's role internally via `is_admin()` and `is_staff_or_admin()` helpers, with no client-supplied role parameter.

**Rationale**: Prevents privilege escalation — a customer cannot pass `role = 'admin'` to see all appointments. The DB function is the authority on what the caller can see.

### 3. No third-party calendar library
**Decision**: Weekly and monthly calendar views are implemented with CSS Grid and native `Date` operations. No FullCalendar, react-big-calendar, or similar.

**Rationale**: This is an MVP. A calendar library adds significant bundle weight. The requirements are simple: weekly column layout and monthly grid with event dots/chips. Both are achievable in ~200 lines of TSX + Tailwind without runtime dependencies. A library can be introduced in #25 if drag-and-drop makes it worthwhile.

**Alternative considered**: `react-big-calendar` or `@fullcalendar/react`. Rejected for MVP due to bundle weight and over-engineering for read-only display.

### 4. Shared appointment card component
**Decision**: Extract `AppointmentCard` as a shared component used in both `AppointmentsPage` and `StaffAppointmentsPage`. The card accepts a `showCustomerName: boolean` prop to toggle which secondary field is shown.

**Rationale**: The two pages are structurally identical except for the card's secondary field (staff name vs. customer name). Sharing the card avoids duplication. The boolean prop keeps it simple — no complex polymorphism.

### 5. Tab filtering is client-side (no separate RPC calls)
**Decision**: Próximos vs. Historial tabs filter from the already-loaded `list_appointments()` result in memory. No separate RPC call per tab.

**Rationale**: The 200-row limit means all appointments fit comfortably in memory. Client-side filtering is instantaneous and avoids extra round-trips. If volume ever requires server-side pagination, the RPC can be augmented then.

### 6. Calendar view navigates weeks/months independently of the active tab
**Decision**: In calendar mode, the user navigates forward/backward through weeks or months. The visible events are all appointments (not tab-filtered). The tab filter applies only in list mode.

**Rationale**: A calendar showing only "upcoming" appointments would be confusing — past appointments should still be visible when scrolling back. Calendar is a temporal view; tabs are a status filter. They are orthogonal concerns.

## Risks / Trade-offs

- **200-row hard limit**: If a customer has >200 appointments (unlikely in MVP), older ones won't appear. Acceptable for now; pagination is a post-MVP concern. → Mitigation: the limit is documented in the RPC and BACKLOG.
- **Client-side calendar rendering performance**: With 200 appointments, rendering all event chips in a monthly view could be slow. → Mitigation: limit chips to 3 per day cell with a "+N more" indicator.
- **No real-time updates**: The appointment list doesn't auto-refresh via Supabase Realtime. → Mitigation: manual re-fetch on page focus is sufficient for MVP. Real-time is a post-MVP optimization.
- **CSS Grid calendar complexity**: Custom calendar has no external maintenance. → Mitigation: keep it simple — week = 7 columns, month = 6×7 grid, no drag targets, no resize.

## Migration Plan

1. Apply migration `supabase/migrations/<timestamp>_list_appointments_rpc.sql` — adds the `list_appointments()` function; no schema changes
2. Run `echo Y | npx supabase db push` to apply
3. Deploy frontend (Vercel CI auto-deploys on `main` push)
4. No rollback complexity — the RPC is additive; dropping it reverts fully

## Open Questions

None. All architecture decisions resolved per BACKLOG.md item #20.
