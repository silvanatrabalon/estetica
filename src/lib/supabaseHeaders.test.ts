import { describe, expect, it } from 'vitest'
import { buildClientHeaders } from './supabase'

describe('buildClientHeaders', () => {
  it('sends only the client info header by default', () => {
    expect(buildClientHeaders(undefined)).toEqual({ 'x-client-info': 'estetica-app/1.0' })
    expect(buildClientHeaders('')).not.toHaveProperty('x-skip-notifications')
  })

  it('adds x-skip-notifications when notifications are disabled', () => {
    expect(buildClientHeaders('false')).toHaveProperty('x-skip-notifications', 'true')
  })

  it('is case and whitespace tolerant (edge case)', () => {
    expect(buildClientHeaders(' FALSE ')).toHaveProperty('x-skip-notifications', 'true')
  })

  it('does not skip for true or unrelated values (edge case)', () => {
    expect(buildClientHeaders('true')).not.toHaveProperty('x-skip-notifications')
    expect(buildClientHeaders('0')).not.toHaveProperty('x-skip-notifications')
  })
})
