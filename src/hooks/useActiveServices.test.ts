import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useActiveServices } from './useActiveServices'
import type { Service } from '../services/adminServices'

const mockFrom = vi.fn()

vi.mock('../lib/supabase', () => ({
  initSupabase: () => ({
    from: mockFrom,
  }),
}))

const activeService: Service = {
  id: 'svc-active-1',
  organizationId: 'org-1',
  name: 'Corte de cabello',
  durationMinutes: 60,
  priceCents: 5000,
  imageUrl: null,
  isActive: true,
  maxConcurrentBookings: null,
  createdAt: '2025-01-01T00:00:00Z',
}

function buildQueryChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
  }
  return chain
}

describe('useActiveServices', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('returns only active services', async () => {
    mockFrom.mockReturnValueOnce(
      buildQueryChain({
        data: [
          {
            id: activeService.id,
            organization_id: activeService.organizationId,
            name: activeService.name,
            duration_minutes: activeService.durationMinutes,
            price_cents: activeService.priceCents,
            image_url: null,
            is_active: true,
            max_concurrent_bookings: null,
            created_at: activeService.createdAt,
          },
        ],
        error: null,
      }),
    )

    const { result } = renderHook(() => useActiveServices())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.services).toHaveLength(1)
    expect(result.current.services[0].id).toBe(activeService.id)
    expect(result.current.services[0].isActive).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('returns empty array when no active services', async () => {
    mockFrom.mockReturnValueOnce(buildQueryChain({ data: [], error: null }))

    const { result } = renderHook(() => useActiveServices())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.services).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('surfaces a Spanish error string on fetch failure', async () => {
    mockFrom.mockReturnValueOnce(
      buildQueryChain({ data: null, error: new Error('DB error') }),
    )

    const { result } = renderHook(() => useActiveServices())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toMatch(/servicios/)
    expect(result.current.services).toEqual([])
  })
})
