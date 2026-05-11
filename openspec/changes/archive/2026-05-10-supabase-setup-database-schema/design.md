## Context

The repository already includes frontend bootstrap and Supabase client initialization, but does not yet define a reproducible PostgreSQL schema lifecycle. Feature dependencies in the backlog require a stable relational baseline before auth behavior, role authorization, and scheduling logic can be safely implemented.

## Goals / Non-Goals

**Goals:**
- Establish a deterministic Supabase hosted-project setup workflow for schema development.
- Define a normalized MVP foundation schema with explicit primary keys, foreign keys, and integrity constraints.
- Use versioned SQL migrations as the single mechanism for schema evolution.
- Define initial indexes for expected MVP read paths and uniqueness guarantees.
- Apply baseline security hardening for exposed tables (RLS enabled + deny-by-default for `anon`/`authenticated`).
- Provide verification steps to validate migrations and schema readiness.

**Non-Goals:**
- Implementing authentication providers or login UX flows.
- Defining full role model behavior and complete business-specific RLS policy set.
- Implementing advanced scheduling rules, appointment conflict logic, or analytics.
- Introducing a custom backend API layer outside Supabase-native capabilities.

## Decisions

1. Migration-first database lifecycle
- Decision: All schema changes will be delivered as ordered SQL migration files under the Supabase workflow.
- Rationale: Keeps local/staging/production schema evolution deterministic, auditable, and rollback-capable.
- Alternative considered: Manual dashboard changes.
- Why not: Non-reproducible and error-prone across environments.

2. Foundation schema scope limited to cross-feature primitives
- Decision: Include only entities and relations required as a base for upcoming features, with room for incremental extension.
- Rationale: Supports MVP-first development while avoiding over-modeling early domain complexity.
- Alternative considered: Full future-state schema now.
- Why not: Increases risk of rework and complexity before validating core workflows.

3. Explicit relational integrity at database layer
- Decision: Use NOT NULL, CHECK, UNIQUE, FK, and sensible defaults where applicable.
- Rationale: Enforces data consistency independent of client behavior and aligns with security-first backend design.
- Alternative considered: Validation only in frontend/services.
- Why not: Client-side-only validation is insufficient for integrity and concurrency safety.

4. Query-driven initial indexing
- Decision: Start with a minimal set of indexes derived from MVP access patterns (tenant/date/staff/user lookups and uniqueness constraints).
- Rationale: Improves read performance early while controlling write overhead.
- Alternative considered: Index everything proactively.
- Why not: Over-indexing harms write performance and complicates maintenance.

5. Keep authorization concerns separated
- Decision: Apply baseline table hardening now (RLS enabled + deny-by-default for `anon`/`authenticated`) and defer complete business-specific policy logic to a follow-up feature.
- Rationale: Maintains dependency order in backlog and keeps this change focused.
- Alternative considered: Including RLS now.
- Why not: Full business policy design conflicts with feature sequencing and mixes concerns.

## Risks / Trade-offs

- [Risk] Initial schema misses a near-term relation needed by the next feature.
  -> Mitigation: Keep migrations small and additive; allow follow-up delta migration in the next change.

- [Risk] Early indexes do not match real query behavior.
  -> Mitigation: Validate with EXPLAIN ANALYZE and adjust incrementally as usage patterns emerge.

- [Risk] Remote environments diverge if manual changes are applied.
  -> Mitigation: Enforce migration-only policy and document verification steps in contributor workflow.

- [Risk] Deferring full business-specific RLS may be interpreted as lower security.
  -> Mitigation: Enforce baseline table hardening in this change and implement full policy logic in the immediately following feature.

## Migration Plan

1. Initialize/validate hosted Supabase project connectivity and migration workflow.
2. Add the first migration set creating foundation tables, constraints, and foreign keys.
3. Add migration statements for initial indexes and uniqueness guarantees.
4. Add migration statements that enable RLS on exposed tables and preserve deny-by-default for `anon`/`authenticated` until full policies are introduced.
5. Apply migrations in the target Supabase project and verify expected schema objects plus baseline security controls.
6. Capture verification commands and expected outcomes in setup documentation.
7. For deployment, apply migrations through the standard Supabase migration pipeline.

Rollback strategy:
- Use migration down/revert strategy supported by the workflow, or forward-fix with a corrective migration when rollback is unsafe.
- Never patch schema manually in production outside migration history.

## Open Questions

- Which exact table set is minimally required for the foundation while keeping tenant-ready structure?
- Should timezone defaults be represented at schema level now or deferred to business profile feature?
- Which indexes are mandatory now versus safe to postpone until appointment flows are implemented?
