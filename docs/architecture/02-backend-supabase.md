# Backend (Supabase) Architecture

## Core System
Supabase is the primary backend.

- PostgreSQL database
- Authentication system
- Row Level Security (RLS)
- Storage
- Edge Functions (optional)

## Rules

- Prefer Supabase native features over custom backend
- Avoid REST APIs unless strictly necessary
- Business logic should live in:
  - database constraints
  - RLS policies
  - edge functions (when needed)

## Data Access Pattern

Frontend → Supabase Client → Postgres