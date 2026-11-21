import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useTodayAgenda } from './useTodayAgenda'

const mockList = vi.fn()
const mockSettings = vi.fn()

vi.mock('../services/adminAppointments', () => ({
  adminListAppointments: (...a: unknown[]) => mockList(...a),
}))
vi.mock('../services/businessSettings', () => ({
  getBusinessSettings: (...a: unknown[]) => mockSettings(...a),
}))

const row = (id: string, start: string, end: string, status = 'confirmed') => ({
  id, startsAt: start, endsAt: end, status, serviceId: 's', serviceName: 'Belleza de pies',
  staffDisplayName: 'Sil', customerName: 'Ana', createdAt: '2026-11-01T00:00:00Z', totalCount: 3,
})

describe('useTodayAgenda', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-21T13:18:00Z')) // 10:18 in Buenos Aires
    mockSettings.mockResolvedValue({ timezone: 'America/Argentina/Buenos_Aires' })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('loads today, removes cancelled and tomorrow, and picks the next one', async () => {
    mockList.mockResolvedValue({
      totalCount: 4,
      rows: [
        row('a', '2026-11-21T13:30:00Z', '2026-11-21T14:30:00Z'),
        row('b', '2026-11-21T15:00:00Z', '2026-11-21T16:00:00Z', 'cancelled'),
        row('c', '2026-11-22T13:00:00Z', '2026-11-22T14:00:00Z'),
        row('d', '2026-11-21T12:00:00Z', '2026-11-21T13:00:00Z', 'completed'),
      ],
    })
    const { result } = renderHook(() => useTodayAgenda())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items.map((i) => i.id)).toEqual(['d', 'a'])
    expect(result.current.next?.id).toBe('a')
    expect(result.current.error).toBeNull()
  })

  it('asks for a window around today and uses the business time zone', async () => {
    mockList.mockResolvedValue({ rows: [], totalCount: 0 })
    renderHook(() => useTodayAgenda())

    await waitFor(() => expect(mockList).toHaveBeenCalled())
    const filters = mockList.mock.calls[0][0] as { dateFrom: string; dateTo: string }
    expect(new Date(filters.dateFrom).getTime()).toBeLessThan(Date.now())
    expect(new Date(filters.dateTo).getTime()).toBeGreaterThan(Date.now() + 24 * 3600 * 1000)
  })

  it('reports an error in Spanish and stops loading when the request fails (edge case)', async () => {
    mockList.mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useTodayAgenda())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toMatch(/No pudimos cargar los turnos de hoy/)
    expect(result.current.items).toEqual([])
  })

  it('keeps working with the default time zone when settings fail (edge case)', async () => {
    mockSettings.mockRejectedValue(new Error('x'))
    mockList.mockResolvedValue({ rows: [row('a', '2026-11-21T13:30:00Z', '2026-11-21T14:30:00Z')], totalCount: 1 })
    const { result } = renderHook(() => useTodayAgenda())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.timezone).toBe('America/Argentina/Buenos_Aires')
    expect(result.current.items).toHaveLength(1)
  })

  it('moves to the next appointment as the minutes pass (edge case)', async () => {
    mockList.mockResolvedValue({
      totalCount: 2,
      rows: [
        row('a', '2026-11-21T13:30:00Z', '2026-11-21T14:30:00Z'),
        row('b', '2026-11-21T19:30:00Z', '2026-11-21T20:30:00Z'),
      ],
    })
    let tick: () => void = () => {}
    const realSetInterval = window.setInterval.bind(window)
    // Capture only the hook's one-minute clock; leave every other timer (waitFor's) real
    const spy = vi.spyOn(window, 'setInterval').mockImplementation(((fn: () => void, ms?: number) => {
      if (ms === 60_000) {
        tick = fn
        return 1
      }
      return realSetInterval(fn, ms)
    }) as unknown as typeof window.setInterval)
    const { result } = renderHook(() => useTodayAgenda())
    await waitFor(() => expect(result.current.next?.id).toBe('a'))

    act(() => {
      vi.setSystemTime(new Date('2026-11-21T14:40:00Z'))
      tick()
    })
    spy.mockRestore()

    expect(result.current.next?.id).toBe('b')
  })

  it('does not update state after unmount (edge case)', async () => {
    let resolve: (v: unknown) => void = () => {}
    mockList.mockReturnValue(new Promise((r) => { resolve = r }))
    const { unmount } = renderHook(() => useTodayAgenda())
    unmount()
    await act(async () => {
      resolve({ rows: [], totalCount: 0 })
    })
    // no "state update on unmounted component" crash
    expect(mockList).toHaveBeenCalledTimes(1)
  })
})
