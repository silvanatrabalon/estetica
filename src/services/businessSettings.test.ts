import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveNotificationSettings } from './businessSettings'

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
