import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdminDashboardStats, getStatsByRange } from './adminDashboard'

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

  it('does not expose noShowCount (removed from the RPC)', async () => {
    mockRpc.mockResolvedValueOnce({ data: [mockRpcRow], error: null })

    const result = await getAdminDashboardStats()

    expect(result).not.toHaveProperty('noShowCount')
  })

  it('throws when RPC returns an empty array', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null })

    await expect(getAdminDashboardStats()).rejects.toThrow()
  })
})

describe('getStatsByRange', () => {
  const rangeRow = {
    pending_count: 1,
    confirmed_count: 2,
    cancelled_count: 3,
    completed_count: 4,
    total_count: 10,
    revenue_cents: 50000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps the RPC row to camelCase and calls the RPC with ISO bounds', async () => {
    mockRpc.mockResolvedValueOnce({ data: [rangeRow], error: null })

    const result = await getStatsByRange('2026-05-01', '2026-05-31')

    expect(result).toEqual({
      pendingCount: 1,
      confirmedCount: 2,
      cancelledCount: 3,
      completedCount: 4,
      totalCount: 10,
      revenueCents: 50000,
    })
    const [name, args] = mockRpc.mock.calls[0]
    expect(name).toBe('admin_get_stats_by_range')
    expect(args.p_date_from).toBe(new Date('2026-05-01T00:00:00').toISOString())
    expect(args.p_date_to).toBe(new Date('2026-05-31T23:59:59').toISOString())
  })

  it('returns zeros when the range has no appointments', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ ...rangeRow, pending_count: 0, confirmed_count: 0, cancelled_count: 0, completed_count: 0, total_count: 0, revenue_cents: 0 }],
      error: null,
    })

    const result = await getStatsByRange('2026-05-01', '2026-05-01')

    expect(result.totalCount).toBe(0)
    expect(result.revenueCents).toBe(0)
  })

  it('converts bigint-like strings to numbers', async () => {
    mockRpc.mockResolvedValueOnce({
      data: [{ ...rangeRow, total_count: '10', revenue_cents: '50000' }],
      error: null,
    })

    const result = await getStatsByRange('2026-05-01', '2026-05-31')

    expect(result.totalCount).toBe(10)
    expect(result.revenueCents).toBe(50000)
  })

  it('throws when the RPC returns an error', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'permission denied' } })

    await expect(getStatsByRange('2026-05-01', '2026-05-31')).rejects.toThrow('permission denied')
  })

  it('throws when the RPC returns no rows', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null })

    await expect(getStatsByRange('2026-05-01', '2026-05-31')).rejects.toThrow()
  })
})
