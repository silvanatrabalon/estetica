# Authentication & Security

## Auth System
- Supabase Auth
- OAuth providers (Google, etc.)

## Security Model
- Row Level Security (RLS) is the main authorization layer
- Never trust frontend for permissions

## Rules
- No service keys in frontend
- Separate public vs private env vars
- Validate access at database level