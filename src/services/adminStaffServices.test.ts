import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listStaffServices,
  listAssignableServices,
  assignServiceToStaff,
  unassignServiceFromStaff,
} from './adminStaffServices'
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
  name: 'Corte de cabello',
  duration_minutes: 60,
  price_cents: 500000,
  image_url: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
}

describe('adminStaffServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listStaffServices', () => {
    it('calls admin_list_staff_services with correct param', async () => {
      const rpc = createSupabaseMock({ data: [], error: null })
      await listStaffServices('staff-123')
      expect(rpc).toHaveBeenCalledWith('admin_list_staff_services', {
        p_staff_member_id: 'staff-123',
      })
    })

    it('maps snake_case rows to camelCase', async () => {
      createSupabaseMock({ data: [mockRow], error: null })
      const result = await listStaffServices('staff-123')
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        serviceId: 'svc-1',
        name: 'Corte de cabello',
        durationMinutes: 60,
        priceCents: 500000,
        imageUrl: null,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      })
    })

    it('throws on RPC error', async () => {
      createSupabaseMock({ data: null, error: new Error('RPC failed') })
      await expect(listStaffServices('staff-123')).rejects.toThrow('RPC failed')
    })
  })

  describe('listAssignableServices', () => {
    it('calls admin_list_assignable_services with correct param', async () => {
      const rpc = createSupabaseMock({ data: [], error: null })
      await listAssignableServices('staff-456')
      expect(rpc).toHaveBeenCalledWith('admin_list_assignable_services', {
        p_staff_member_id: 'staff-456',
      })
    })

    it('maps snake_case rows to camelCase', async () => {
      createSupabaseMock({ data: [mockRow], error: null })
      const result = await listAssignableServices('staff-456')
      expect(result[0].serviceId).toBe('svc-1')
      expect(result[0].durationMinutes).toBe(60)
    })
  })

  describe('assignServiceToStaff', () => {
    it('calls admin_assign_service_to_staff with correct params', async () => {
      const rpc = createSupabaseMock({ data: null, error: null })
      await assignServiceToStaff('staff-123', 'svc-1')
      expect(rpc).toHaveBeenCalledWith('admin_assign_service_to_staff', {
        p_staff_member_id: 'staff-123',
        p_service_id: 'svc-1',
      })
    })

    it('throws on RPC error', async () => {
      createSupabaseMock({ data: null, error: new Error('No autorizado') })
      await expect(assignServiceToStaff('staff-123', 'svc-1')).rejects.toThrow('No autorizado')
    })
  })

  describe('unassignServiceFromStaff', () => {
    it('calls admin_unassign_service_from_staff with correct params', async () => {
      const rpc = createSupabaseMock({ data: null, error: null })
      await unassignServiceFromStaff('staff-123', 'svc-1')
      expect(rpc).toHaveBeenCalledWith('admin_unassign_service_from_staff', {
        p_staff_member_id: 'staff-123',
        p_service_id: 'svc-1',
      })
    })

    it('throws on RPC error', async () => {
      createSupabaseMock({ data: null, error: new Error('No autorizado') })
      await expect(unassignServiceFromStaff('staff-123', 'svc-1')).rejects.toThrow('No autorizado')
    })
  })
})
