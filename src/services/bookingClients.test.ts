import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clientLabel, listBookingClients } from './bookingClients'

const mockRpc = vi.fn()
vi.mock('../lib/supabase', () => ({ initSupabase: () => ({ rpc: mockRpc }) }))

describe('listBookingClients', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps the rows', async () => {
    mockRpc.mockResolvedValue({
      data: [{ kind: 'account', user_id: 'u1', name: 'Ana', email: 'ana@mail.com', phone: '11', is_active: true }],
      error: null,
    })
    expect(await listBookingClients()).toEqual([
      { kind: 'account', userId: 'u1', name: 'Ana', email: 'ana@mail.com', phone: '11', isActive: true },
    ])
    expect(mockRpc).toHaveBeenCalledWith('list_booking_clients')
  })

  it('treats a missing name as empty (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: [{ user_id: 'u1', name: null, email: null }], error: null })
    expect(await listBookingClients()).toEqual([
      { kind: 'account', userId: 'u1', name: '', email: null, phone: null, isActive: true },
    ])
  })

  it('includes deactivated accounts and people without account (edge case)', async () => {
    mockRpc.mockResolvedValue({
      data: [
        { kind: 'account', user_id: 'u1', name: 'Maxi', email: 'm@x.com', phone: null, is_active: false },
        { kind: 'guest', user_id: null, name: 'Rosa', email: null, phone: '1155', is_active: true },
      ],
      error: null,
    })
    const list = await listBookingClients()
    expect(list[0]).toMatchObject({ kind: 'account', isActive: false })
    expect(list[1]).toMatchObject({ kind: 'guest', userId: null, phone: '1155' })
  })

  it('throws when the database refuses (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'BOOKING_NOT_ALLOWED' } })
    await expect(listBookingClients()).rejects.toThrow('BOOKING_NOT_ALLOWED')
  })
})

describe('clientLabel', () => {
  const base = { kind: 'account' as const, userId: '1', phone: null, isActive: true }

  it('shows name and email, only the email, or a placeholder', () => {
    expect(clientLabel({ ...base, name: 'Ana', email: 'a@x.com' })).toBe('Ana (a@x.com)')
    expect(clientLabel({ ...base, name: '  ', email: 'a@x.com' })).toBe('a@x.com')
    expect(clientLabel({ ...base, name: 'Ana', email: null })).toBe('Ana')
    expect(clientLabel({ ...base, name: '', email: null })).toBe('Cliente sin nombre')
  })

  it('flags deactivated accounts and people without account (edge cases)', () => {
    expect(clientLabel({ ...base, name: 'Maxi', email: null, isActive: false })).toBe('Maxi · inactivo')
    expect(clientLabel({ ...base, kind: 'guest', userId: null, name: 'Rosa', email: null })).toBe('Rosa · sin cuenta')
  })
})
