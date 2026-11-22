import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  adminCreateStaffWithoutAccount,
  adminLinkStaffMember,
  adminRenameStaffMember,
  listAdminStaffMembers,
  translateStaffError,
} from './adminStaff'

const mockRpc = vi.fn()
vi.mock('../lib/supabase', () => ({ initSupabase: () => ({ rpc: mockRpc }) }))

const row = {
  id: 's1',
  organization_id: 'o1',
  profile_user_id: null,
  display_name: 'Laura Sosa',
  is_active: true,
  created_at: '2026-11-21T00:00:00Z',
  full_name: null,
  role: 'staff',
  invite_email: 'laura@mail.com',
}

describe('professionals without an account', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates one with a name and an optional email', async () => {
    mockRpc.mockResolvedValue({ data: [row], error: null })
    const created = await adminCreateStaffWithoutAccount('Laura Sosa', ' laura@mail.com ')
    expect(mockRpc).toHaveBeenCalledWith('admin_create_staff_without_account', {
      p_display_name: 'Laura Sosa',
      p_email: 'laura@mail.com',
    })
    expect(created.profileUserId).toBeNull()
    expect(created.inviteEmail).toBe('laura@mail.com')
  })

  it('a blank email is sent as null (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: [{ ...row, invite_email: null }], error: null })
    await adminCreateStaffWithoutAccount('Laura Sosa', '   ')
    expect(mockRpc).toHaveBeenCalledWith('admin_create_staff_without_account', expect.objectContaining({ p_email: null }))
  })

  it('translates database errors (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'STAFF_INVITE_EMAIL_TAKEN' } })
    await expect(adminCreateStaffWithoutAccount('Laura', 'a@b.com')).rejects.toThrow('Ya hay un profesional sin cuenta con ese email.')
  })

  it('links a professional to an account', async () => {
    mockRpc.mockResolvedValue({ data: [{ ...row, profile_user_id: 'u1', invite_email: null }], error: null })
    const linked = await adminLinkStaffMember('s1', 'u1')
    expect(mockRpc).toHaveBeenCalledWith('admin_link_staff_member', { p_staff_id: 's1', p_user_id: 'u1' })
    expect(linked.profileUserId).toBe('u1')
    expect(linked.inviteEmail).toBeNull()
  })

  it('refuses an account that already has a professional (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'STAFF_USER_TAKEN' } })
    await expect(adminLinkStaffMember('s1', 'u1')).rejects.toThrow('Esa cuenta ya tiene un profesional.')
  })

  it('renames, and explains why a linked professional cannot be renamed here (edge case)', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await adminRenameStaffMember('s1', 'Laura S.')
    expect(mockRpc).toHaveBeenCalledWith('admin_rename_staff_member', { p_staff_id: 's1', p_display_name: 'Laura S.' })
    mockRpc.mockResolvedValueOnce({ error: { message: 'STAFF_NAME_FROM_ACCOUNT' } })
    await expect(adminRenameStaffMember('s1', 'X Y')).rejects.toThrow('se cambia desde su cuenta')
  })

  it('the list maps invite_email and tolerates it missing (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: [row, { ...row, id: 's2', invite_email: undefined }], error: null })
    const list = await listAdminStaffMembers()
    expect(list[0].inviteEmail).toBe('laura@mail.com')
    expect(list[1].inviteEmail).toBeNull()
  })

  it('translateStaffError falls back to a generic message', () => {
    expect(translateStaffError('algo raro')).toMatch(/No pudimos guardar/)
  })
})
