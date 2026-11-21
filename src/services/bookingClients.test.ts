import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clientLabel, listBookingClients } from './bookingClients'

const mockRpc = vi.fn()
vi.mock('../lib/supabase', () => ({ initSupabase: () => ({ rpc: mockRpc }) }))

describe('listBookingClients', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps the rows', async () => {
    mockRpc.mockResolvedValue({ data: [{ user_id: 'u1', name: 'Ana', email: 'ana@mail.com' }], error: null })
    expect(await listBookingClients()).toEqual([{ userId: 'u1', name: 'Ana', email: 'ana@mail.com' }])
    expect(mockRpc).toHaveBeenCalledWith('list_booking_clients')
  })

  it('treats a missing name as empty (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: [{ user_id: 'u1', name: null, email: null }], error: null })
    expect(await listBookingClients()).toEqual([{ userId: 'u1', name: '', email: null }])
  })

  it('throws when the database refuses (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'BOOKING_NOT_ALLOWED' } })
    await expect(listBookingClients()).rejects.toThrow('BOOKING_NOT_ALLOWED')
  })
})

describe('clientLabel', () => {
  it('shows name and email, only the email, or a placeholder', () => {
    expect(clientLabel({ userId: '1', name: 'Ana', email: 'a@x.com' })).toBe('Ana (a@x.com)')
    expect(clientLabel({ userId: '1', name: '  ', email: 'a@x.com' })).toBe('a@x.com')
    expect(clientLabel({ userId: '1', name: 'Ana', email: null })).toBe('Ana')
    expect(clientLabel({ userId: '1', name: '', email: null })).toBe('Cliente sin nombre')
  })
})
