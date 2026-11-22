import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMyAgenda } from './useMyAgenda'

const mockList = vi.fn()
vi.mock('../services/appointments', () => ({
  listMyStaffAppointments: (...a: unknown[]) => mockList(...a),
}))

const apt = (id: string, start: string, end: string, status = 'confirmed', customerName: string | null = 'Ana') => ({
  id,
  startsAt: start,
  endsAt: end,
  status,
  createdAt: '2026-11-01T00:00:00Z',
  customerUserId: 'u',
  serviceId: 's',
  serviceName: 'Belleza de pies',
  serviceDurationMinutes: 60,
  servicePriceCents: 1000,
  staffDisplayName: 'Sil',
  orgName: 'Spa',
  orgTimezone: 'America/Argentina/Buenos_Aires',
  customerName,
})

describe('useMyAgenda', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-21T13:18:00Z')) // Sat 10:18 in Buenos Aires
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('builds today agenda, next appointment and counters from the own appointments', async () => {
    mockList.mockResolvedValue([
      apt('a', '2026-11-21T13:30:00Z', '2026-11-21T14:30:00Z'),
      apt('b', '2026-11-21T15:00:00Z', '2026-11-21T16:00:00Z', 'cancelled'),
      apt('c', '2026-11-17T13:00:00Z', '2026-11-17T14:00:00Z', 'completed'),
    ])
    const { result } = renderHook(() => useMyAgenda())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.items.map((i) => i.id)).toEqual(['a'])
    expect(result.current.featured[0]?.id).toBe('a')
    expect(result.current.stats).toEqual({ today: 1, upcoming: 1, month: 2, cancelledMonth: 1 })
  })

  it('is empty without appointments (edge case)', async () => {
    mockList.mockResolvedValue([])
    const { result } = renderHook(() => useMyAgenda())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items).toEqual([])
    expect(result.current.featured).toEqual([])
    expect(result.current.stats).toEqual({ today: 0, upcoming: 0, month: 0, cancelledMonth: 0 })
  })

  it('shows a placeholder name when the client has none (edge case)', async () => {
    mockList.mockResolvedValue([apt('a', '2026-11-21T13:30:00Z', '2026-11-21T14:30:00Z', 'confirmed', null)])
    const { result } = renderHook(() => useMyAgenda())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.items[0].customerName).toBe('Cliente sin nombre')
  })

  it('reports an error message when loading fails (edge case)', async () => {
    mockList.mockRejectedValue(new Error('down'))
    const { result } = renderHook(() => useMyAgenda())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toMatch(/No pudimos cargar tus turnos/)
  })
})
