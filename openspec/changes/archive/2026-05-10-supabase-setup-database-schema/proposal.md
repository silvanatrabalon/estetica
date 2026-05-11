## Why

The project has frontend bootstrap and Supabase client wiring, but it lacks a database foundation that is reproducible across environments. We need a versioned schema baseline now so future auth, role, and booking features can be built on consistent PostgreSQL structures.

## What Changes

- Configure deterministic Supabase project connectivity using environment variables and versioned migration workflow against the hosted project.
- Define an MVP-ready PostgreSQL foundation schema using normalized tables, explicit relations, and constraints.
- Introduce versioned SQL migrations as the only path for schema evolution.
- Add initial indexes for expected MVP query patterns and uniqueness guarantees.
- Document migration and verification steps for local/staging/production consistency.
- Apply baseline table security (RLS enabled + deny-by-default for `anon`/`authenticated`) while explicitly excluding authentication flow implementation and full business-specific RLS policy modeling from this change.

## Capabilities

### New Capabilities
- `supabase-schema-foundation`: Establishes Supabase database setup, base relational schema, versioned migrations, and initial index strategy for the MVP.

### Modified Capabilities
- None.

## Impact

- Adds new OpenSpec artifacts and implementation tasks for schema foundation work.
- Introduces SQL migration files and supporting Supabase project configuration.
- Affects future features that depend on base entities, foreign keys, and query performance paths.
- No runtime auth flow changes and no full authorization policy changes in this phase.
