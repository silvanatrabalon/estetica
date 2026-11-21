import type { User } from '@supabase/supabase-js'
import type { AppRole } from '../context/UserContext'

/**
 * Google profile photo from the OAuth metadata, or null when missing / not a safe https URL.
 * Supabase stores it as `avatar_url` (and `picture` for some providers).
 */
export function getGoogleAvatarUrl(user: Pick<User, 'user_metadata'> | null | undefined): string | null {
  const meta = user?.user_metadata as Record<string, unknown> | undefined
  const raw = meta?.avatar_url ?? meta?.picture
  if (typeof raw !== 'string') return null

  const url = raw.trim()
  if (!url) return null

  try {
    return new URL(url).protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

/** Only staff and admins show their photo in the header; customers keep their initials. */
export function canShowProfilePhoto(roles: readonly AppRole[]): boolean {
  return roles.includes('staff') || roles.includes('admin')
}
