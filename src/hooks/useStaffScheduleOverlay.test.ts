import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useStaffScheduleOverlay } from './useStaffScheduleOverlay'

const mockFrom = vi.hoisted(() => vi.fn())
const mockSupabase = vi.hoisted(() => ({
  from: mockFrom,
}))

vi.mock('../lib/supabase', () => ({
  initSupabase: () => mockSupabase,
}))

// Helper to build a chainable Supabase query mock that resolves on .order() or .lte()
function buildQuery(resolveValue: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  const resolver = vi.fn().mockResolvedValue(resolveValue)
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.gte = vi.fn().mockReturnValue(chain)
  chain.lte = resolver   // exceptions query ends here
  chain.order = resolver // schedules query ends here
  return chain
}

describe('useStaffScheduleOverlay', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('returns empty maps when staffMemberId is null', () => {
    const { result } = renderHook(() =>
      useStaffScheduleOverlay(null, new Date('2026-05-11T00:00:00Z')),
    )
    expect(result.current.scheduleByDay).toEqual({})
    expect(result.current.exceptionsByDate).toEqual({})
    expect(result.current.loading).toBe(false)
  })

  it('fetches schedules and exceptions for the week', async () => {
    const scheduleRow = {
      id: 'sched-1',
      staff_member_id: 'staff-1',
      day_of_week: 1,
      is_working: true,
      starts_at: '09:00',
      ends_at: '18:00',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }
    const exceptionRow = {
      id: 'exc-1',
      staff_member_id: 'staff-1',
      exception_date: '2026-05-13',
      exception_type: 'day_off',
      starts_at: null,
      ends_at: null,
      reason: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    }

    // Route by table name so order doesn't matter
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName === 'staff_schedules') {
        return buildQuery({ data: [scheduleRow], error: null })
      }
      return buildQuery({ data: [exceptionRow], error: null })
    })

    const { result } = renderHook(() =>
      useStaffScheduleOverlay('staff-1', new Date('2026-05-11T00:00:00Z')),
    )

    // Wait for async effect
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(result.current.scheduleByDay[1]).toMatchObject({
      dayOfWeek: 1,
      isWorking: true,
    })
    expect(result.current.exceptionsByDate['2026-05-13']).toMatchObject({
      exceptionType: 'day_off',
    })
    expect(result.current.error).toBeNull()
  })

  it('sets error state when fetch fails', async () => {
    mockFrom.mockImplementation(() =>
      buildQuery({ data: null, error: new Error('DB error') }),
    )

    const { result } = renderHook(() =>
      useStaffScheduleOverlay('staff-1', new Date('2026-05-11T00:00:00Z')),
    )

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(result.current.error).toMatch(/disponibilidad/)
  })
})
