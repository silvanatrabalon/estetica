import type { User } from '@supabase/supabase-js'
import { initSupabase } from '../lib/supabase'
import {
  type ProfileBootstrapStatus,
  type ProfileRecord,
  getGooglePreferredName,
  isProfileComplete,
  normalizePhone,
  normalizeProfileName,
} from '../lib/profile'
import { profileCopy } from '../lib/uiCopy'

interface ProfileRow {
  user_id: string
  full_name: string | null
  phone: string | null
}

export interface ProfileBootstrapResult {
  status: ProfileBootstrapStatus
  profile: ProfileRecord | null
  warning: string | null
}

export interface ProfileUpdateInput {
  name: string
  phone: string
}

function toProfileRecord(row: ProfileRow): ProfileRecord {
  return {
    userId: row.user_id,
    name: row.full_name?.trim() ?? '',
    phone: row.phone,
  }
}

export async function getMyProfile(): Promise<ProfileRecord | null> {
  const supabase = initSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, phone')
    .eq('user_id', user.id)
    .maybeSingle<ProfileRow>()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return toProfileRecord(data)
}

export async function ensureProfileOnBootstrap(user: User): Promise<ProfileBootstrapResult> {
  const supabase = initSupabase()

  try {
    const existingProfile = await getMyProfile()

    if (existingProfile) {
      return {
        status: isProfileComplete(existingProfile) ? 'complete' : 'incomplete',
        profile: existingProfile,
        warning: isProfileComplete(existingProfile)
          ? null
          : profileCopy.incompleteWarning,
      }
    }

    const prefillName = getGooglePreferredName(user)

    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        full_name: prefillName || null,
        phone: null,
      })

    if (insertError) {
      const duplicateKey = String(insertError.message).toLowerCase().includes('duplicate')

      if (!duplicateKey) {
        throw insertError
      }
    }

    const createdProfile = await getMyProfile()

    if (!createdProfile) {
      return {
        status: 'load-error',
        profile: null,
        warning: profileCopy.syncUnavailableWarning,
      }
    }

    const complete = isProfileComplete(createdProfile)

    return {
      status: complete ? 'complete' : 'incomplete',
      profile: createdProfile,
      warning: complete
        ? null
        : profileCopy.incompleteWarning,
    }
  } catch (err) {
    console.error('[profile] ensureProfileOnBootstrap failed:', err)
    return {
      status: 'load-error',
      profile: null,
      warning: profileCopy.syncUnavailableWarning,
    }
  }
}

export async function updateMyProfile(input: ProfileUpdateInput): Promise<ProfileRecord> {
  const supabase = initSupabase()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error('Authenticated user is required to update profile.')
  }

  const payload = {
    full_name: normalizeProfileName(input.name),
    phone: normalizePhone(input.phone),
    updated_at: new Date().toISOString(),
  }

  // Try to update first
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update(payload)
    .eq('user_id', user.id)
    .select('user_id, full_name, phone')
    .single<ProfileRow>()

  // If no row was found (PGRST116), create it as a fallback
  if (updateError?.code === 'PGRST116') {
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        full_name: normalizeProfileName(input.name),
        phone: normalizePhone(input.phone),
      })
      .select('user_id, full_name, phone')
      .single<ProfileRow>()

    if (insertError) {
      throw insertError
    }

    return toProfileRecord(insertData)
  }

  if (updateError) {
    throw updateError
  }

  return toProfileRecord(updateData)
}

export async function listProfilesForAdmin(): Promise<ProfileRecord[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, phone')
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => toProfileRecord(row as ProfileRow))
}

export async function updateProfileByAdmin(userId: string, input: ProfileUpdateInput): Promise<ProfileRecord> {
  const supabase = initSupabase()
  const payload = {
    full_name: normalizeProfileName(input.name),
    phone: normalizePhone(input.phone),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('user_id', userId)
    .select('user_id, full_name, phone')
    .single<ProfileRow>()

  if (error) {
    throw error
  }

  return toProfileRecord(data)
}
