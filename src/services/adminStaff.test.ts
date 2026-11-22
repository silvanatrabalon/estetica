import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listLinkedStaffUserIds } from './adminStaff'

const mockRpc = vi.fn()

vi.mock('../lib/supabase', () => ({
  initSupabase: () => ({ rpc: mockRpc }),
}))

describe('listLinkedStaffUserIds', () => {
  beforeEach(() => mockRpc.mockReset())

  it('returns the ids of the accounts that already have a professional', async () => {
    mockRpc.mockResolvedValue({ data: [{ user_id: 'u1' }, { user_id: 'u2' }], error: null })
    expect(await listLinkedStaffUserIds()).toEqual(['u1', 'u2'])
    expect(mockRpc).toHaveBeenCalledWith('admin_staff_linked_user_ids')
  })

  it('is empty when there are none or the server sends nothing (edge case)', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null })
    expect(await listLinkedStaffUserIds()).toEqual([])
    mockRpc.mockResolvedValueOnce({ data: null, error: null })
    expect(await listLinkedStaffUserIds()).toEqual([])
  })

  it('throws the server message on error (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'boom' } })
    await expect(listLinkedStaffUserIds()).rejects.toThrow('boom')
  })
})
