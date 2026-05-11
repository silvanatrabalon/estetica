## 1. Supabase Hosted Setup

- [x] 1.1 Add and validate Supabase hosted project configuration for deterministic schema workflows.
- [x] 1.2 Document the hosted project connection and migration command sequence used by contributors.

## 2. Foundation Schema Migrations

- [x] 2.1 Create initial versioned migration files for MVP foundation entities.
- [x] 2.2 Define explicit PK/FK relations and integrity constraints (NOT NULL, UNIQUE, CHECK, defaults where needed).
- [x] 2.3 Ensure migration scope excludes auth flow implementation and full business-specific RLS policy design.
- [x] 2.4 Apply baseline table security in migrations: enable RLS on exposed tables and keep deny-by-default for `anon`/`authenticated` until full policies are introduced.

## 3. Initial Index Strategy

- [x] 3.1 Define initial indexes from MVP query paths (tenant/date/staff/user access patterns).
- [x] 3.2 Add uniqueness indexes/constraints to enforce key invariants and avoid duplicate logical records.
- [x] 3.3 Validate index usefulness with representative query plans in the target Supabase project and adjust if over-indexed.

## 4. Verification and Documentation

- [x] 4.1 Apply migrations in the target Supabase project and verify required tables, constraints, indexes, and baseline security controls (RLS enabled + no unintended access for `anon`/`authenticated`).
- [x] 4.2 Add migration verification guidance to project documentation (setup/readme/docs as appropriate).
- [x] 4.3 Confirm migration-only workflow is clear for staging/production promotion.
