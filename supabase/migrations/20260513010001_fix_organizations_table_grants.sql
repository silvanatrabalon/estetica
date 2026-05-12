-- Fix organizations table permissions that were revoked by foundation_schema.
-- This restores table-level grants so RLS policies can take effect.

grant select, insert, update, delete on table public.organizations to authenticated;
