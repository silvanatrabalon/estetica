import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMyAvailabilityPermission, getMyDaysOffPermission } from './staffAvailability'
import {
  adminSetStaffAvailabilityPermission,
  adminSetStaffDaysOffPermission,
  listStaffAvailabilityPermissions,
} from './adminStaff'

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
        { staff_member_id: 'a', can_edit_own_availability: true, can_edit_own_days_off: false },
        { staff_member_id: 'b', can_edit_own_availability: false, can_edit_own_days_off: true },
      ],
      error: null,
    })
    expect(await listStaffAvailabilityPermissions()).toEqual({
      a: { canEditSchedule: true, canEditDaysOff: false },
      b: { canEditSchedule: false, canEditDaysOff: true },
    })
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

describe('days off permission', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getMyDaysOffPermission returns true/false and fails open (edge case)', async () => {
    mockRpc.mockResolvedValueOnce({ data: true, error: null })
    expect(await getMyDaysOffPermission()).toBe(true)
    mockRpc.mockResolvedValueOnce({ data: false, error: null })
    expect(await getMyDaysOffPermission()).toBe(false)
    mockRpc.mockResolvedValueOnce({ data: null, error: null })
    expect(await getMyDaysOffPermission()).toBe(true)
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error('down') })
    expect(await getMyDaysOffPermission()).toBe(true)
  })

  it('a missing days-off column defaults to allowed (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: [{ staff_member_id: 'a', can_edit_own_availability: false }], error: null })
    expect(await listStaffAvailabilityPermissions()).toEqual({
      a: { canEditSchedule: false, canEditDaysOff: true },
    })
  })

  it('adminSetStaffDaysOffPermission calls the right RPC and propagates errors', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await adminSetStaffDaysOffPermission('sm-1', false)
    expect(mockRpc).toHaveBeenCalledWith('admin_set_staff_days_off_permission', {
      p_staff_id: 'sm-1',
      p_allowed: false,
    })
    mockRpc.mockResolvedValue({ error: new Error('No autorizado') })
    await expect(adminSetStaffDaysOffPermission('sm-1', true)).rejects.toThrow('No autorizado')
  })
})
