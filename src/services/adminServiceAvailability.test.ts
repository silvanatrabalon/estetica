import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listServiceAvailableDates,
  addServiceAvailableDate,
  removeServiceAvailableDate,
} from './adminServiceAvailability'
import { initSupabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  initSupabase: vi.fn(),
}))

type RpcMock = ReturnType<typeof vi.fn>

function createSupabaseMock(rpcResult: { data: unknown; error: unknown }) {
  const rpc: RpcMock = vi.fn().mockResolvedValue(rpcResult)
  const client = { rpc }
  vi.mocked(initSupabase).mockReturnValue(client as never)
  return rpc
}

const mockRow = {
  service_id: 'svc-1',
  available_date: '2026-06-15',
  created_at: '2026-01-01T00:00:00.000Z',
}

describe('adminServiceAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listServiceAvailableDates', () => {
    it('calls admin_list_service_available_dates with correct p_service_id param', async () => {
      const rpc = createSupabaseMock({ data: [], error: null })
      await listServiceAvailableDates('svc-1')
      expect(rpc).toHaveBeenCalledWith('admin_list_service_available_dates', {
        p_service_id: 'svc-1',
      })
    })

    it('maps snake_case rows to camelCase', async () => {
      createSupabaseMock({ data: [mockRow], error: null })
      const result = await listServiceAvailableDates('svc-1')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        serviceId: 'svc-1',
        availableDate: '2026-06-15',
        createdAt: '2026-01-01T00:00:00.000Z',
      })
    })

    it('returns empty array when no dates configured', async () => {
      createSupabaseMock({ data: [], error: null })
      const result = await listServiceAvailableDates('svc-1')
      expect(result).toEqual([])
    })

    it('throws on RPC error', async () => {
      createSupabaseMock({ data: null, error: new Error('RPC failed') })
      await expect(listServiceAvailableDates('svc-1')).rejects.toThrow('RPC failed')
    })
  })

  describe('addServiceAvailableDate', () => {
    it('calls admin_add_service_available_date with correct params', async () => {
      const rpc = createSupabaseMock({ data: null, error: null })
      await addServiceAvailableDate('svc-1', '2026-06-15')
      expect(rpc).toHaveBeenCalledWith('admin_add_service_available_date', {
        p_service_id: 'svc-1',
        p_date: '2026-06-15',
      })
    })

    it('throws on RPC error', async () => {
      createSupabaseMock({ data: null, error: new Error('No autorizado') })
      await expect(addServiceAvailableDate('svc-1', '2026-06-15')).rejects.toThrow('No autorizado')
    })
  })

  describe('removeServiceAvailableDate', () => {
    it('calls admin_remove_service_available_date with correct params', async () => {
      const rpc = createSupabaseMock({ data: null, error: null })
      await removeServiceAvailableDate('svc-1', '2026-06-15')
      expect(rpc).toHaveBeenCalledWith('admin_remove_service_available_date', {
        p_service_id: 'svc-1',
        p_date: '2026-06-15',
      })
    })

    it('throws on RPC error', async () => {
      createSupabaseMock({ data: null, error: new Error('RPC failed') })
      await expect(removeServiceAvailableDate('svc-1', '2026-06-15')).rejects.toThrow('RPC failed')
    })
  })
})
