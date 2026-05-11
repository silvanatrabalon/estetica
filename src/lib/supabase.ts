/**
 * Supabase client bootstrap and initialization
 * Provides a singleton instance and readiness verification
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { parseEnv } from './env'

let supabaseClient: SupabaseClient | null = null

/**
 * Initialize and return the Supabase client
 * Validates environment variables and creates a singleton instance
 * 
 * Throws with actionable error messages if env is missing or invalid
 */
export function initSupabase(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient
  }

  const config = parseEnv()

  supabaseClient = createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )

  return supabaseClient
}

/**
 * Get the initialized Supabase client
 * Returns null if not yet initialized
 */
export function getSupabase(): SupabaseClient | null {
  return supabaseClient
}

/**
 * Verify Supabase is accessible and properly configured
 * Returns a readiness report with diagnostic information
 * 
 * This is optional and can be called during app initialization
 * or as part of a health check endpoint
 */
export async function verifySupabaseReadiness(): Promise<{
  ready: boolean
  error?: string
  diagnostic?: string
}> {
  try {
    const client = initSupabase()

    // Attempt a simple query to verify connectivity
    // Uses auth().getUser() which does not require any database setup
    const { error } = await client.auth.getUser()

    if (error && error.message !== 'Auth session missing!') {
      // Auth session missing is ok - user just isn't signed in
      // But other errors indicate a configuration problem
      return {
        ready: false,
        error: 'Supabase authentication endpoint unreachable',
        diagnostic: error.message,
      }
    }

    return {
      ready: true,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      ready: false,
      error: 'Failed to initialize Supabase client',
      diagnostic: message,
    }
  }
}
