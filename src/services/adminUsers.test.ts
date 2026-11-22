import { beforeEach, describe, expect, it, vi } from 'vitest'
import { adminDeleteUser } from './adminUsers'

const mockInvoke = vi.fn()
vi.mock('../lib/supabase', () => ({
  initSupabase: () => ({ functions: { invoke: (...a: unknown[]) => mockInvoke(...a) } }),
}))

describe('adminDeleteUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls the function with the user id', async () => {
    mockInvoke.mockResolvedValue({ error: null })
    await adminDeleteUser('u-1')
    expect(mockInvoke).toHaveBeenCalledWith('admin-delete-user', { body: { userId: 'u-1' } })
  })

  it('shows the reason the function answered with (edge case)', async () => {
    const context = new Response(JSON.stringify({ error: 'Unauthorized: admin role required' }), { status: 401 })
    mockInvoke.mockResolvedValue({ error: { message: 'Edge Function returned a non-2xx status code', context } })
    await expect(adminDeleteUser('u-1')).rejects.toThrow('Unauthorized: admin role required')
  })

  it('uses a generic message when the answer has no reason (edge cases)', async () => {
    mockInvoke.mockResolvedValue({ error: { context: new Response('<html>', { status: 500 }) } })
    await expect(adminDeleteUser('u-1')).rejects.toThrow('Ocurrió un error al eliminar el usuario.')
    mockInvoke.mockResolvedValue({ error: { context: new Response(JSON.stringify({ error: '  ' }), { status: 500 }) } })
    await expect(adminDeleteUser('u-1')).rejects.toThrow('Ocurrió un error al eliminar el usuario.')
  })

  it('keeps the message of a network error (edge case)', async () => {
    mockInvoke.mockResolvedValue({ error: new Error('Failed to send a request to the Edge Function') })
    await expect(adminDeleteUser('u-1')).rejects.toThrow('Failed to send a request to the Edge Function')
  })
})
