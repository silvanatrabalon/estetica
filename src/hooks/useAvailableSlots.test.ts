import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAvailableSlots } from './useAvailableSlots'
import type { AvailableSlot } from '../services/availability'

const mockRpc = vi.fn()

vi.mock('../lib/supabase', () => ({
  initSupabase: () => ({
    rpc: mockRpc,
  }),
}))

const slot1: AvailableSlot = {
  starts_at: '2025-06-10T14:00:00Z',
  ends_at: '2025-06-10T15:00:00Z',
}
const slot2: AvailableSlot = {
  starts_at: '2025-06-10T14:30:00Z',
  ends_at: '2025-06-10T15:30:00Z',
}

describe('useAvailableSlots', () => {
  beforeEach(() => {
    mockRpc.mockReset()
  })

  it('is idle when both inputs are null', () => {
    const { result } = renderHook(() => useAvailableSlots(null, null))
    expect(result.current.slots).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('is idle when serviceId is null', () => {
    const { result } = renderHook(() => useAvailableSlots(null, '2025-06-10'))
    expect(result.current.slots).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('is idle when date is null', () => {
    const { result } = renderHook(() => useAvailableSlots('svc-1', null))
    expect(result.current.slots).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('fetches and returns slots when both inputs provided', async () => {
    mockRpc.mockResolvedValueOnce({ data: [slot1, slot2], error: null })

    const { result } = renderHook(() => useAvailableSlots('svc-1', '2025-06-10'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.slots).toEqual([slot1, slot2])
    expect(result.current.error).toBeNull()
    expect(mockRpc).toHaveBeenCalledWith('get_available_slots', {
      p_service_id: 'svc-1',
      p_date: '2025-06-10',
    })
  })

  it('returns empty array when RPC returns no slots', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null })

    const { result } = renderHook(() => useAvailableSlots('svc-1', '2025-06-10'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.slots).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('surfaces a Spanish error string on RPC failure', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error('RPC failed') })

    const { result } = renderHook(() => useAvailableSlots('svc-1', '2025-06-10'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toMatch(/horarios/)
    expect(result.current.slots).toEqual([])
  })

  it('re-fetches when serviceId changes', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: [slot1], error: null })
      .mockResolvedValueOnce({ data: [slot2], error: null })

    const { result, rerender } = renderHook(
      ({ svcId, date }: { svcId: string; date: string }) =>
        useAvailableSlots(svcId, date),
      { initialProps: { svcId: 'svc-1', date: '2025-06-10' } },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.slots).toEqual([slot1])

    rerender({ svcId: 'svc-2', date: '2025-06-10' })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.slots).toEqual([slot2])
    expect(mockRpc).toHaveBeenCalledTimes(2)
  })

  it('re-fetches when date changes', async () => {
    mockRpc
      .mockResolvedValueOnce({ data: [slot1], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const { result, rerender } = renderHook(
      ({ svcId, date }: { svcId: string; date: string }) =>
        useAvailableSlots(svcId, date),
      { initialProps: { svcId: 'svc-1', date: '2025-06-10' } },
    )

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.slots).toEqual([slot1])

    rerender({ svcId: 'svc-1', date: '2025-06-11' })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.slots).toEqual([])
    expect(mockRpc).toHaveBeenCalledTimes(2)
  })
})
