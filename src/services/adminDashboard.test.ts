import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdminDashboardStats } from './adminDashboard'

// ── Mock Supabase ────────────────────────────────────────────────────────────

const mockRpc = vi.fn()

vi.mock('../lib/supabase', () => ({
  initSupabase: () => ({
    rpc: mockRpc,
  }),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockRpcRow = {
  today_count: 3,
  week_count: 15,
  month_count: 42,
  pending_count: 2,
  confirmed_count: 8,
  cancelled_count: 5,
  completed_count: 27,
  no_show_count: 3,
  revenue_cents_month: 135000,
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getAdminDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps RPC snake_case response to AdminDashboardStats camelCase fields', async () => {
    mockRpc.mockResolvedValueOnce({ data: [mockRpcRow], error: null })

    const result = await getAdminDashboardStats()

    expect(result).toEqual({
      todayCount: 3,
      weekCount: 15,
      monthCount: 42,
      pendingCount: 2,
      confirmedCount: 8,
      cancelledCount: 5,
      completedCount: 27,
      noShowCount: 3,
      revenueCentsMonth: 135000,
    })
  })

  it('converts bigint-like numeric strings to numbers', async () => {
    // Supabase may return bigint as string in some environments
    const bigintRow = {
      today_count: '5',
      week_count: '20',
      month_count: '60',
      pending_count: '3',
      confirmed_count: '10',
      cancelled_count: '4',
      completed_count: '40',
      no_show_count: '3',
      revenue_cents_month: '200000',
    }
    mockRpc.mockResolvedValueOnce({ data: [bigintRow], error: null })

    const result = await getAdminDashboardStats()

    expect(typeof result.todayCount).toBe('number')
    expect(result.todayCount).toBe(5)
    expect(result.revenueCentsMonth).toBe(200000)
  })

  it('throws when RPC returns an error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } })

    await expect(getAdminDashboardStats()).rejects.toThrow('permission denied')
  })

  it('throws when data is null or empty', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null })

    await expect(getAdminDashboardStats()).rejects.toThrow()
  })
})
