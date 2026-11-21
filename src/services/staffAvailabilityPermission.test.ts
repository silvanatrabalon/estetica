import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMyAvailabilityPermission } from './staffAvailability'
import { adminSetStaffAvailabilityPermission, listStaffAvailabilityPermissions } from './adminStaff'

const mockRpc = vi.fn()
vi.mock('../lib/supabase', () => ({ initSupabase: () => ({ rpc: mockRpc }) }))

describe('getMyAvailabilityPermission', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true when allowed and false when not', async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null })
    expect(await getMyAvailabilityPermission()).toBe(true)
    mockRpc.mockResolvedValueOnce({ data: false, error: null })
    expect(await getMyAvailabilityPermission()).toBe(false)
  })

  it('treats null (not staff) as allowed, the server still enforces writes (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })
    expect(await getMyAvailabilityPermission()).toBe(true)
  })

  it('fails open when the lookup errors (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('down') })
    expect(await getMyAvailabilityPermission()).toBe(true)
  })
})

describe('admin permission services', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps rows to an id -> permission record', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { staff_member_id: 'a', can_edit_own_availability: true },
        { staff_member_id: 'b', can_edit_own_availability: false },
      ],
      error: null,
    })
    expect(await listStaffAvailabilityPermissions()).toEqual({ a: true, b: false })
  })

  it('returns an empty record when there are no professionals (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })
    expect(await listStaffAvailabilityPermissions()).toEqual({})
  })

  it('propagates list errors', async () => {
    mockRpc.mockResolvedValue({ data: null, error: new Error('nope') })
    await expect(listStaffAvailabilityPermissions()).rejects.toThrow('nope')
  })

  it('calls the admin RPC with the right arguments', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await adminSetStaffAvailabilityPermission('sm-1', false)
    expect(mockRpc).toHaveBeenCalledWith('admin_set_staff_availability_permission', {
      p_staff_id: 'sm-1',
      p_allowed: false,
    })
  })

  it('propagates set errors (edge case)', async () => {
    mockRpc.mockResolvedValue({ error: new Error('No autorizado') })
    await expect(adminSetStaffAvailabilityPermission('sm-1', true)).rejects.toThrow('No autorizado')
  })
})
