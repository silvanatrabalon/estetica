## Context

Admins currently have no way to view all organization appointments in one place. The existing `/admin/reports` route is reserved for analytics (#26). A dedicated admin appointments list is needed for day-to-day operational monitoring: seeing who is booked, filtering by status (e.g., finding all `cancelled` appointments for a date range), and navigating pages of results without loading the entire table.

All required tables (`appointments`, `profiles`, `services`, `staff_members`) and the `is_admin()` helper are already in production. This change adds a single new SECURITY DEFINER RPC and a new frontend page.

## Goals / Non-Goals

**Goals:**
- SECURITY DEFINER RPC `admin_list_appointments` that filters server-side and returns paginated results with a `total_count`
- `AdminAppointmentsPage` at `/admin/appointments` with status multi-select, date range inputs, and previous/next pagination
- Navigation entry in the admin sidebar
- TypeScript service layer with typed interfaces and camelCase mappers
- Spanish copy for all UI states

**Non-Goals:**
- Full-text search (requires `pg_trgm` — post-MVP)
- Analytics / KPIs → #26
- CSV export
- Inline appointment detail expansion (card links to `/booking/confirmation/:id`)
- Cursor-based pagination (offset is sufficient for MVP volume)

## Decisions

### 1. SECURITY DEFINER RPC over direct client query
**Decision:** All data access goes through `admin_list_appointments` SECURITY DEFINER RPC.
**Rationale:** Customers must not have SELECT grants on `profiles` or `staff_members`. A SECURITY DEFINER function runs as the defining role and can JOIN across tables regardless of the caller's grants — consistent with every other admin RPC in this project (`admin_list_services`, `admin_set_staff_schedule`, etc.).
**Alternative considered:** Direct Supabase client query with explicit JOINs. Rejected because it would require relaxing RLS grants on `profiles` and `staff_members` which are currently admin-only.

### 2. Offset pagination (not cursor)
**Decision:** `p_page integer` + `p_page_size integer` with a `total_count` return column.
**Rationale:** Simpler to implement and reason about. Admin appointment volume is bounded (single-tenant business). The RPC can return both rows and `total_count` in one call using a window function (`COUNT(*) OVER()`).
**Alternative considered:** Cursor pagination. Deferred — adds implementation complexity without benefit at current scale.

### 3. `total_count` via window function
**Decision:** `COUNT(*) OVER() AS total_count` in the SELECT list returns the filtered total alongside each row, eliminating a second COUNT query.
**Rationale:** Single round-trip; consistent with the PostgreSQL SECURITY DEFINER pattern used throughout the project. The frontend reads `rows[0].total_count` (or 0 when empty).

### 4. NULL = no filter
**Decision:** NULL parameter values mean "no filter applied" for each dimension (`p_statuses`, `p_date_from`, `p_date_to`).
**Rationale:** Simplest API — the frontend omits params it doesn't need. Avoids a proliferation of optional RPC variants.

### 5. Default page size 50
**Decision:** `p_page_size` defaults to 50 if NULL.
**Rationale:** Sufficient rows for a desktop admin list without excessive payload. Can be overridden by the caller.

### 6. `customer_name` fallback
**Decision:** `COALESCE(pr.full_name, au.email, '—')` — full name if set, email from `auth.users` if not, hard-coded "—" as last resort.
**Rationale:** Profiles may be incomplete for early users. Showing email is more useful than a blank. Requires the SECURITY DEFINER context to join `auth.users`.

### 7. New `src/services/adminAppointments.ts` service file
**Decision:** Separate file from `src/services/appointments.ts`.
**Rationale:** The admin list interface (`AdminAppointmentRow`, pagination, filters) is distinct from the customer-facing `AppointmentSummary`. Keeping them separate avoids coupling and follows the existing pattern (`src/services/adminUsers.ts`, `src/services/adminServices.ts`).

## Risks / Trade-offs

- **[Risk] `COUNT(*) OVER()` performance on large tables** → Mitigation: Single-tenant MVP volume is bounded (<10k rows). An index on `appointments(starts_at DESC)` already exists from the booking flow. Acceptable for MVP; add a separate COUNT query + cache if needed post-MVP.
- **[Risk] `auth.users` JOIN in SECURITY DEFINER** → Mitigation: `auth.users` is always accessible in SECURITY DEFINER context. Pattern already used in `admin_list_users` RPC.
- **[Risk] Date range inputs without a date picker library** → Mitigation: Use native `<input type="date">` — consistent with the rest of the project (no date library added). Formatting handled by the browser.

## Migration Plan

1. Write and apply migration: `admin_list_appointments` RPC + `GRANT EXECUTE TO authenticated`
2. Deploy frontend: `AdminAppointmentsPage`, service layer, nav link, route in `App.tsx`
3. No rollback risk — purely additive; no existing tables or policies modified

## Open Questions

- None — all decisions resolved based on existing patterns in the codebase.
