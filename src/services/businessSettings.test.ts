import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveBusinessSettings, saveNotificationSettings } from './businessSettings'

const mockInitSupabase = vi.fn()

vi.mock('../lib/supabase', () => ({
  initSupabase: () => mockInitSupabase(),
}))

describe('saveNotificationSettings — validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each([['sin-arroba'], ['a@b'], ['a b@c.com']])(
    'rejects invalid notification email %s before touching the database',
    async (notificationEmail) => {
      await expect(
        saveNotificationSettings({ notificationEmail, notificationsEnabled: true }),
      ).rejects.toThrow('Ingresá un email válido para las notificaciones.')
      expect(mockInitSupabase).not.toHaveBeenCalled()
    },
  )
})

describe('saveBusinessSettings — address', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects an address over 200 characters before touching the database (edge case)', async () => {
    await expect(
      saveBusinessSettings({
        name: 'Salon',
        timezone: 'America/Argentina/Buenos_Aires',
        address: 'a'.repeat(201),
        weeklyHours: [],
      }),
    ).rejects.toThrow('La dirección no puede superar los 200 caracteres.')
    expect(mockInitSupabase).not.toHaveBeenCalled()
  })
})

