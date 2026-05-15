-- Appointments: grants, RLS policies, and double-booking exclusion constraint.
-- Tasks: 1.1–1.7 of appointment-booking change.

-- 1.1 Enable btree_gist for the exclusion constraint
create extension if not exists btree_gist;

-- 1.2 Grant SELECT to authenticated users (writes go through SECURITY DEFINER RPC only)
grant select on public.appointments to authenticated;

-- 1.3 Customer SELECT policy: own appointments only
create policy "appointments_select_customer"
  on public.appointments
  for select
  to authenticated
  using (customer_user_id = auth.uid());

-- 1.4 Staff/admin SELECT policy: all org appointments
create policy "appointments_select_staff_admin"
  on public.appointments
  for select
  to authenticated
  using (is_staff_or_admin());

-- 1.5 Drop the placeholder unique index (superseded by the exclusion constraint)
drop index if exists public.ux_appointments_staff_exact_slot;

-- 1.6 Add GIST exclusion constraint for half-open interval overlap prevention.
-- Half-open [) semantics: A.ends_at = B.starts_at is NOT an overlap → back-to-back bookings allowed.
-- Only pending/confirmed appointments participate; cancelled/completed/no_show do not block slots.
alter table public.appointments
  add constraint excl_appointments_staff_no_overlap
  exclude using gist (
    staff_member_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status in ('pending', 'confirmed'));

-- 1.7 Supporting index: speed up overlap lookups used by the constraint and RPC
create index if not exists idx_appointments_staff_range_active
  on public.appointments using gist (staff_member_id, tstzrange(starts_at, ends_at, '[)'))
  where status in ('pending', 'confirmed');
