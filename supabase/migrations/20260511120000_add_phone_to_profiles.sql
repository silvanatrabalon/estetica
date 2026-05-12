-- Add optional phone field for MVP user profile updates.

alter table public.profiles
  add column if not exists phone text;
