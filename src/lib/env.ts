/**
 * Environment variable parsing and validation
 * Validates required configuration at application bootstrap time
 */

interface EnvConfig {
  supabase: {
    url: string
    anonKey: string
  }
}

/**
 * Validate that a value is present and non-empty
 */
function validateRequired(value: string | undefined, varName: string): string {
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${varName}\n` +
      `Please set ${varName} in your .env file or environment.\n` +
      `See setup.md for configuration instructions.`
    )
  }
  return value
}

/**
 * Validate that a Supabase URL is properly formatted
 */
function validateSupabaseUrl(url: string): void {
  if (!url.startsWith('https://')) {
    throw new Error(
      `Invalid VITE_SUPABASE_URL: must be an HTTPS URL.\n` +
      `Got: ${url}\n` +
      `Expected format: https://[project-id].supabase.co`
    )
  }

  if (!url.includes('supabase.co')) {
    throw new Error(
      `Invalid VITE_SUPABASE_URL: must be a valid Supabase URL.\n` +
      `Got: ${url}\n` +
      `Expected format: https://[project-id].supabase.co`
    )
  }
}

/**
 * Validate that a Supabase anon key has minimal required format
 */
function validateSupabaseAnonKey(key: string): void {
  if (key.length < 20) {
    throw new Error(
      `Invalid VITE_SUPABASE_ANON_KEY: key appears malformed (too short).\n` +
      `Expected a valid Supabase anonymous key (typically 100+ characters).`
    )
  }
}

/**
 * Parse and validate all required environment variables
 * Throws descriptive errors if any required variable is missing or invalid
 */
export function parseEnv(): EnvConfig {
  const supabaseUrl = validateRequired(
    import.meta.env.VITE_SUPABASE_URL,
    'VITE_SUPABASE_URL'
  )

  const supabaseAnonKey = validateRequired(
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    'VITE_SUPABASE_ANON_KEY'
  )

  // Validate URL format
  validateSupabaseUrl(supabaseUrl)

  // Validate key format
  validateSupabaseAnonKey(supabaseAnonKey)

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    },
  }
}

/**
 * Get parsed environment configuration
 * Safe to call after parseEnv() has succeeded
 */
export function getEnvConfig(): EnvConfig {
  return parseEnv()
}
