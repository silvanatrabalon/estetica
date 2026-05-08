# Frontend Architecture

## Stack
- React + Vite
- TypeScript
- TailwindCSS

## Structure
- components/
- features/
- pages/
- hooks/
- services/
- lib/

## Principles
- Feature-based organization preferred
- UI separated from business logic
- Minimal global state usage
- React Query for server state

## Data Access
- All backend access via Supabase client
- No direct database access from UI logic layer