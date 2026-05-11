import type { User } from '@supabase/supabase-js'
import { initSupabase } from '../lib/supabase'

const CALLBACK_QUERY_KEYS = ['code', 'error', 'error_description'] as const
const APP_ROLES = ['customer', 'staff', 'admin'] as const

export type AppRole = (typeof APP_ROLES)[number]

/**
 * Starts Google OAuth through Supabase Auth.
 */
export async function signInWithGoogle(): Promise<void> {
  const supabase = initSupabase()
  const redirectTo = `${window.location.origin}${window.location.pathname}`

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  })

  if (error) {
    throw error
  }
}

/**
 * Returns the current authenticated user from the Supabase session, if any.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = initSupabase()
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session?.user ?? null
}

/**
 * Resolves the authenticated user's effective app role from the database.
 * This is sourced from PostgreSQL role mapping, not client-side claims.
 */
export async function getCurrentUserRole(): Promise<AppRole | null> {
  const supabase = initSupabase()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw sessionError
  }

  if (!session?.user) {
    return null
  }

  const { data, error } = await supabase.rpc('current_app_role')

  if (error) {
    throw error
  }

  if (data === null) {
    return 'customer'
  }

  if (!APP_ROLES.includes(data as AppRole)) {
    throw new Error(`Unexpected app role received from database: ${String(data)}`)
  }

  return data as AppRole
}

/**
 * Subscribes to auth state changes and returns an unsubscribe function.
 */
export function subscribeToAuthChanges(
  onUserChange: (user: User | null) => void
): () => void {
  const supabase = initSupabase()
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    onUserChange(session?.user ?? null)
  })

  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Detects whether the current URL contains callback parameters from OAuth.
 */
export function isAuthCallbackUrl(): boolean {
  const searchParams = new URLSearchParams(window.location.search)
  return CALLBACK_QUERY_KEYS.some((key) => searchParams.has(key))
}

/**
 * Returns a human-readable callback error when OAuth redirects with an error.
 */
export function getAuthCallbackError(): string | null {
  const searchParams = new URLSearchParams(window.location.search)
  const rawError = searchParams.get('error')

  if (!rawError) {
    return null
  }

  const description = searchParams.get('error_description')
  return description ?? rawError
}