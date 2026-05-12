import type { User } from '@supabase/supabase-js'

export interface ProfileRecord {
  userId: string
  name: string
  phone: string | null
}

export type ProfileBootstrapStatus = 'complete' | 'incomplete' | 'load-error'

export function isProfileComplete(profile: Pick<ProfileRecord, 'name'> | null): boolean {
  if (!profile) {
    return false
  }

  return profile.name.trim().length > 0
}

export function normalizeProfileName(name: string): string {
  return name.trim()
}

export function normalizePhone(phone: string): string | null {
  const normalized = phone.trim()
  return normalized.length > 0 ? normalized : null
}

export function getGooglePreferredName(user: User): string {
  const metadata = user.user_metadata as Record<string, unknown> | undefined

  const candidate =
    (typeof metadata?.name === 'string' && metadata.name) ||
    (typeof metadata?.full_name === 'string' && metadata.full_name) ||
    (typeof metadata?.given_name === 'string' && metadata.given_name) ||
    ''

  return candidate.trim()
}

export function validateProfileInput(input: { name: string; phone: string }): {
  valid: boolean
  errors: { name?: string }
} {
  const errors: { name?: string } = {}

  if (normalizeProfileName(input.name).length === 0) {
    errors.name = 'El nombre es obligatorio.'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
