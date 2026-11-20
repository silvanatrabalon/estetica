import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveBusinessSettings } from './businessSettings'

const mockInitSupabase = vi.fn()

vi.mock('../lib/supabase', () => ({
  initSupabase: () => mockInitSupabase(),
}))

const validInput = {
  name: 'Salon Centro',
  timezone: 'America/Argentina/Buenos_Aires',
  logoUrl: '',
  primaryColor: '',
  bookingHeaderText: '',
  bookingSubtitleText: '',
  weeklyHours: [],
}

describe('saveBusinessSettings — notification email validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([['sin-arroba'], ['a@b'], ['a b@c.com']])(
    'rejects invalid notification email %s before touching the database',
    async (notificationEmail) => {
      await expect(saveBusinessSettings({ ...validInput, notificationEmail })).rejects.toThrow(
        'Ingresá un email válido para las notificaciones.',
      )
      expect(mockInitSupabase).not.toHaveBeenCalled()
    },
  )
})
