import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdminStats } from './adminStats'

const mockRpc = vi.fn()
vi.mock('../lib/supabase', () => ({ initSupabase: () => ({ rpc: mockRpc }) }))

describe('getAdminStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('passes the period and maps the payload to numbers', async () => {
    mockRpc.mockResolvedValue({
      data: {
        totals: { services: '5', revenue_cents: 22000, clients: 1 },
        professionals: [{ staff_member_id: 's1', display_name: 'Sil', services: '3', revenue_cents: '12000' }],
        months: [{ month: '2026-11', services: 2, revenue_cents: 10000 }],
        clients: [{ customer_user_id: 'u1', name: 'Ana', visits: 4, spent_cents: '30000' }],
      },
      error: null,
    })
    const stats = await getAdminStats('2026-11-01', '2026-11-30')
    expect(mockRpc).toHaveBeenCalledWith('admin_get_stats', { p_from: '2026-11-01', p_to: '2026-11-30' })
    expect(stats.totals).toEqual({ services: 5, revenueCents: 22000, clients: 1 })
    expect(stats.professionals[0]).toEqual({ staffMemberId: 's1', displayName: 'Sil', services: 3, revenueCents: 12000 })
    expect(stats.months[0].revenueCents).toBe(10000)
    expect(stats.clients[0]).toEqual({ customerUserId: 'u1', name: 'Ana', visits: 4, spentCents: 30000 })
  })

  it('an empty payload gives zeros and empty lists (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: {}, error: null })
    const stats = await getAdminStats(null, null)
    expect(stats.totals).toEqual({ services: 0, revenueCents: 0, clients: 0 })
    expect(stats.professionals).toEqual([])
    expect(stats.months).toEqual([])
    expect(stats.clients).toEqual([])
  })

  it('throws when the database refuses (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'No autorizado' } })
    await expect(getAdminStats(null, null)).rejects.toThrow('No autorizado')
  })
})
