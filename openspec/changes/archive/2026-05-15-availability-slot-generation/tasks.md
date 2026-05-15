## 1. 16a — Core RPC: staff schedule resolution + slot generation + overlap exclusion

- [x] 1.1 Create migration file `supabase/migrations/YYYYMMDDHHMMSS_get_available_slots_core.sql`
- [x] 1.2 Implement `get_available_slots(p_service_id uuid, p_date date) RETURNS TABLE(starts_at timestamptz, ends_at timestamptz)` as SECURITY DEFINER
- [x] 1.3 Resolve active staff assigned to the service via `staff_services` join (`is_active = true`)
- [x] 1.4 For each staff member, resolve working window: check `staff_schedule_exceptions` for the date first; fall back to `staff_schedules` for the weekday; no row = no window (staff contributes no slots)
- [x] 1.5 Intersect each staff working window with the `business_hours` row for that weekday (hard gate: absent row = closed; return early with zero rows if no business hours exist)
- [x] 1.6 Check `business_closure_exceptions` for the date; return early with zero rows if a closure row exists
- [x] 1.7 Convert working window wall-clock times to UTC: `(p_date + window_start) AT TIME ZONE org_timezone`
- [x] 1.8 Generate candidate slots at 30-minute intervals (`SLOT_INTERVAL = interval '30 minutes'`); exclude any slot where `slot_start + service.duration_minutes > window_end_utc`
- [x] 1.9 Exclude candidate slots overlapping `pending` or `confirmed` appointments for each staff member (`slot_start < appt_end AND slot_end > appt_start`)
- [x] 1.10 Aggregate across all staff: a slot is included in the result if at least one staff member has it available; deduplicate with `DISTINCT`
- [x] 1.11 Grant `EXECUTE` on `get_available_slots` to `authenticated` role
- [x] 1.12 Run `supabase db push` and verify the function is created without errors

## 2. 16b — RPC extension: service date whitelist + capacity cap

- [x] 2.1 Add early-exit check: if `service_available_dates` rows exist for the service and `p_date` is not in that set, return zero rows
- [x] 2.2 Add capacity cap check: for each candidate slot, count `pending` + `confirmed` appointments for the service at that time; exclude slots where count ≥ `services.max_concurrent_bookings` (skip check when `max_concurrent_bookings` is null)
- [x] 2.3 Use `CREATE OR REPLACE FUNCTION` to update the function in-place
- [x] 2.4 Run `supabase db push` and verify the updated function works correctly

## 3. 16c — RPC extension: booking policy window + notice cutoff

- [x] 3.1 Add early-exit check for booking horizon: compute `(now() AT TIME ZONE org_timezone)::date + booking_max_horizon_days`; if `p_date > horizon_date`, return zero rows
- [x] 3.2 Add slot-level notice cutoff: exclude any candidate slot where `slot_start < now() + interval '1 minute' * booking_min_notice_minutes`
- [x] 3.3 Use `CREATE OR REPLACE FUNCTION` to update the function in-place
- [x] 3.4 Run `supabase db push` and verify the updated function enforces policy correctly
- [x] 3.5 Create `src/lib/formatSlotTime.ts` exporting `formatSlotTime(isoUtc: string, orgTimezone: string): string` using `Intl.DateTimeFormat`; fall back to `'UTC'` for invalid timezone input
- [x] 3.6 Re-export `formatSlotTime` from `src/lib/index.ts`
- [x] 3.7 Write unit tests for `formatSlotTime`: correct timezone conversion, UTC fallback for empty/invalid timezone

## 4. 16d — TypeScript service layer and hooks

- [x] 4.1 Create `src/services/availability.ts` with `AvailableSlot` type (`{ starts_at: string; ends_at: string }`) and `getAvailableSlots(serviceId: string, date: string): Promise<AvailableSlot[]>` calling `supabase.rpc('get_available_slots', { p_service_id: serviceId, p_date: date })`; throw on error
- [x] 4.2 Re-export `getAvailableSlots` and `AvailableSlot` from `src/services/index.ts`
- [x] 4.3 Create `src/hooks/useAvailableSlots.ts` with signature `useAvailableSlots(serviceId: string | null, date: string | null)` returning `{ slots: AvailableSlot[]; loading: boolean; error: string | null }`; skip fetch when either input is null; reset on input change; surface Spanish error string on failure
- [x] 4.4 Create `src/hooks/useActiveServices.ts` querying `services` where `is_active = true`; return `{ services: Service[]; loading: boolean; error: string | null }`; surface Spanish error string on failure
- [x] 4.5 Re-export both hooks from `src/hooks/index.ts`
- [x] 4.6 Write unit tests for `useAvailableSlots`: idle when inputs null, loading state, success resolves with slot array, error surfaces Spanish string, re-fetches on input change
- [x] 4.7 Write unit tests for `useActiveServices`: returns only active services, surfaces Spanish error on failure

## 5. 16e — Customer booking wizard (BookingPage 3-step UI)

- [x] 5.1 Replace `src/pages/BookingPage.tsx` stub with a 3-step wizard component using local state (`step: 1 | 2 | 3`, `selectedServiceId`, `selectedDate`, `selectedSlot`)
- [x] 5.2 Step 1 — ServiceSelector: render active services list using `useActiveServices`; show Spanish loading state ("Cargando servicios…"), Spanish empty state ("No hay servicios disponibles"), and Spanish error state; advance to step 2 on service selection
- [x] 5.3 Step 2 — BookingDatePicker: render `<input type="date">` constrained to `[today, today + booking_max_horizon_days]`; show back button labeled "← Volver"; advance to step 3 on date selection
- [x] 5.4 Step 3 — SlotGrid: call `useAvailableSlots(selectedServiceId, selectedDate)`; show Spanish loading state ("Buscando horarios disponibles…"); show Spanish empty state ("No hay horarios disponibles para esta fecha") when result is empty; show Spanish error state on failure; render each slot as a button displaying `formatSlotTime(slot.starts_at, orgTimezone)` using the org's timezone
- [x] 5.5 On slot selection store `selectedSlot` in component state (no navigation — booking creation is #17)
- [x] 5.6 Confirm `BookingPage` is rendered under `<ProtectedRoute role="customer">` in the router; verify `useUser` guard redirects unauthenticated users to `/signin` and non-customer roles to `/unauthorized`
- [x] 5.7 Write integration tests for `BookingPage`: step 1 renders services, selecting service advances to step 2, selecting date advances to step 3, slot grid renders slots, empty state shown when no slots, error state shown on RPC failure, Spanish copy verified across all states
- [x] 5.8 Create `supabase/tests/availability_slot_generation.sql`: seed org + service + staff + schedule + business hours, assert happy-path slot count; seed conflicting appointment, assert conflicted slot absent; seed business closure, assert zero rows returned

## 6. Verification

- [x] 6.1 Run full test suite (`npm run test`) and confirm all tests pass (no regressions)
- [x] 6.2 Run `openspec status --change "availability-slot-generation"` and confirm all 4 artifacts are complete
- [x] 6.3 Archive the change: `openspec archive --change "availability-slot-generation"`
- [x] 6.4 Commit: `git add -A && git commit -m "feat(#16): availability slot generation"`
