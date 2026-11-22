import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildClientHeaders } from '../../../src/lib/supabase'

// The browser blocks a call to a function when the app sends a header the function does not allow.
// The app adds x-skip-notifications to every request while notifications are off in local development.
describe('admin-delete-user CORS', () => {
  const source = readFileSync('supabase/functions/admin-delete-user/index.ts', 'utf8')
  const allowed = (/'Access-Control-Allow-Headers':\s*'([^']+)'/.exec(source)?.[1] ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())

  it('allows every header the app adds to its requests, with notifications on and off', () => {
    for (const flag of [undefined, 'true', 'false']) {
      for (const header of Object.keys(buildClientHeaders(flag))) {
        expect(allowed, header).toContain(header.toLowerCase())
      }
    }
  })

  it('still allows the headers supabase-js always sends', () => {
    for (const header of ['authorization', 'apikey', 'content-type', 'x-client-info']) {
      expect(allowed).toContain(header)
    }
  })
})
