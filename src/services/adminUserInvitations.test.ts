import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  adminDeleteUserInvitation,
  adminInviteUser,
  adminListUserInvitations,
  translateInviteError,
} from './adminUsers'

const mockRpc = vi.fn()
vi.mock('../lib/supabase', () => ({ initSupabase: () => ({ rpc: mockRpc }) }))

describe('user invitations', () => {
  beforeEach(() => vi.clearAllMocks())

  it('invites with email, trimmed name and roles', async () => {
    mockRpc.mockResolvedValue({ data: [{ status: 'invited', user_id: null, invitation_id: 'i1' }], error: null })
    const result = await adminInviteUser('nora@mail.com', '  Nora Díaz ', ['admin', 'staff'])
    expect(mockRpc).toHaveBeenCalledWith('admin_invite_user', {
      p_email: 'nora@mail.com',
      p_full_name: 'Nora Díaz',
      p_roles: ['admin', 'staff'],
    })
    expect(result).toEqual({ status: 'invited', invitationId: 'i1' })
  })

  it('a blank name is sent as null (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: [{ status: 'invited', user_id: null, invitation_id: 'i1' }], error: null })
    await adminInviteUser('nora@mail.com', '   ', ['customer'])
    expect(mockRpc).toHaveBeenCalledWith('admin_invite_user', expect.objectContaining({ p_full_name: null }))
  })

  it('reports an email that already has an account', async () => {
    mockRpc.mockResolvedValue({ data: [{ status: 'exists', user_id: 'u9', invitation_id: null }], error: null })
    expect(await adminInviteUser('ya@existe.com', '', ['staff'])).toEqual({ status: 'exists', userId: 'u9' })
  })

  it('translates the database errors (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'INVITE_ALREADY_PENDING' } })
    await expect(adminInviteUser('a@b.com', '', ['staff'])).rejects.toThrow('Ya hay una invitación pendiente para ese email.')
  })

  it('an empty answer is an error, not a silent success (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    await expect(adminInviteUser('a@b.com', '', ['staff'])).rejects.toThrow('No pudimos guardar la invitación')
  })

  it('lists pending invitations', async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: 'i1', email: 'nora@mail.com', full_name: null, roles: ['staff'], created_at: '2026-11-21T00:00:00Z' }],
      error: null,
    })
    expect(await adminListUserInvitations()).toEqual([
      { id: 'i1', email: 'nora@mail.com', name: null, roles: ['staff'], createdAt: '2026-11-21T00:00:00Z' },
    ])
  })

  it('deletes an invitation and surfaces errors', async () => {
    mockRpc.mockResolvedValueOnce({ error: null })
    await adminDeleteUserInvitation('i1')
    expect(mockRpc).toHaveBeenCalledWith('admin_delete_user_invitation', { p_id: 'i1' })
    mockRpc.mockResolvedValueOnce({ error: { message: 'INVITE_NOT_FOUND' } })
    await expect(adminDeleteUserInvitation('i1')).rejects.toThrow('No encontramos esa invitación.')
  })

  it('translateInviteError falls back to a generic message', () => {
    expect(translateInviteError('raro')).toMatch(/No pudimos guardar/)
  })
})
