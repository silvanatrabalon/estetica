/**
 * Application readiness and bootstrap verification
 * Validates configuration and Supabase connectivity at startup
 */

import { verifySupabaseReadiness } from './supabase'

export interface ReadinessReport {
  ready: boolean
  checks: {
    supabase: {
      ready: boolean
      error?: string
    }
  }
  errors: string[]
}

/**
 * Perform a complete readiness check of the application
 * Returns a detailed report with all diagnostic information
 */
export async function checkReadiness(): Promise<ReadinessReport> {
  const errors: string[] = []
  const checks = {
    supabase: {
      ready: false,
      error: undefined as string | undefined,
    },
  }

  // Check Supabase
  const supabaseResult = await verifySupabaseReadiness()
  checks.supabase.ready = supabaseResult.ready
  if (!supabaseResult.ready) {
    checks.supabase.error = supabaseResult.error
    errors.push(
      `Supabase: ${supabaseResult.error}\n  Details: ${supabaseResult.diagnostic}`
    )
  }

  return {
    ready: errors.length === 0,
    checks,
    errors,
  }
}

/**
 * Format a readiness report for console output
 * Used for debugging and diagnostic purposes
 */
export function formatReadinessReport(report: ReadinessReport): string {
  const lines: string[] = []

  lines.push('')
  lines.push('=== Application Readiness Report ===')
  lines.push(`Status: ${report.ready ? '✓ READY' : '✗ NOT READY'}`)
  lines.push('')

  lines.push('Checks:')
  lines.push(`  Supabase: ${report.checks.supabase.ready ? '✓' : '✗'}`)
  if (report.checks.supabase.error) {
    lines.push(`    Error: ${report.checks.supabase.error}`)
  }

  if (report.errors.length > 0) {
    lines.push('')
    lines.push('Issues:')
    report.errors.forEach((err) => {
      lines.push(`  • ${err}`)
    })
    lines.push('')
    lines.push('Next steps:')
    lines.push('  1. Check your .env file for missing or invalid values')
    lines.push('  2. Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
    lines.push('  3. Ensure your Supabase project is active and accessible')
    lines.push('  4. See setup.md for configuration instructions')
  }

  lines.push('')

  return lines.join('\n')
}
