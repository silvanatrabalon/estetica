import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listNotificationAdmins,
  saveBusinessSettings,
  setNotificationAdmins,
} from './businessSettings'

const mockInitSupabase = vi.fn()

vi.mock('../lib/supabase', () => ({
  initSupabase: () => mockInitSupabase(),
}))

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

describe('administrators that get the copies', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists them with their name, email and whether they get the copies', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ user_id: 'a-1', name: 'Silvana', email: 's@x.com', notify: true }],
      error: null,
    })
    mockInitSupabase.mockReturnValue({ rpc })
    expect(await listNotificationAdmins()).toEqual([{ userId: 'a-1', name: 'Silvana', email: 's@x.com', notify: true }])
    expect(rpc).toHaveBeenCalledWith('admin_list_notification_admins')
  })

  it('gives an empty list when there is no answer and fails with the database message (edge cases)', async () => {
    mockInitSupabase.mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: null, error: null }) })
    expect(await listNotificationAdmins()).toEqual([])
    mockInitSupabase.mockReturnValue({ rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'No autorizado' } }) })
    await expect(listNotificationAdmins()).rejects.toThrow('No autorizado')
  })

  it('sends the chosen ids, also an empty list (edge case)', async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null })
    mockInitSupabase.mockReturnValue({ rpc })
    await setNotificationAdmins(['a-1', 'a-2'])
    expect(rpc).toHaveBeenCalledWith('admin_set_notification_admins', { p_user_ids: ['a-1', 'a-2'] })
    await setNotificationAdmins([])
    expect(rpc).toHaveBeenLastCalledWith('admin_set_notification_admins', { p_user_ids: [] })
  })

  it('fails with the database message when saving is refused (edge case)', async () => {
    mockInitSupabase.mockReturnValue({ rpc: vi.fn().mockResolvedValue({ error: { message: 'No autorizado' } }) })
    await expect(setNotificationAdmins(['a-1'])).rejects.toThrow('No autorizado')
  })
})

