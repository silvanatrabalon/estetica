-- Restore table-level grants revoked by foundation_schema migration.
-- The 20260511013647_foundation_schema migration runs REVOKE ALL on all
-- tables from anon/authenticated, overriding the grants from 20260510192000.
-- The 20260513010001 fix only restored organizations; this restores the rest.

grant select on table
  public.staff_members,
  public.services
to anon;

grant select, insert, update, delete on table
  public.profiles,
  public.organization_memberships,
  public.staff_members,
  public.services,
  public.appointments
to authenticated;
