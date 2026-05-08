# Database Architecture

## Engine
PostgreSQL (via Supabase)

## Principles
- Normalized schema design
- Explicit constraints and relations
- Indexing for performance

## Guidelines
- Avoid over-normalization early
- Keep schema evolution incremental
- Design for multi-tenant readiness if needed

## Migrations
- All schema changes must be versioned