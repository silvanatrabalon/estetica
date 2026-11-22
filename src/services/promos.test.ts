import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  adminDeletePromo,
  adminListPromos,
  adminSavePromo,
  adminSetPromoActive,
  listActivePromos,
  listPublicPromos,
} from './promos'

const mockRpc = vi.fn()
vi.mock('../lib/supabase', () => ({ initSupabase: () => ({ rpc: mockRpc }) }))

const input = {
  id: null,
  name: 'Semana de manos',
  description: '',
  discountType: 'percent' as const,
  discountValue: 20,
  startsOn: '2026-06-01',
  endsOn: '2026-06-30',
  isActive: true,
  showOnSite: true,
  serviceIds: ['s1'],
}

describe('promos service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists promos, tolerating missing arrays and string counts (edge case)', async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: 'p', name: 'N', description: null, discount_type: 'percent', discount_value: 10, starts_on: 'a', ends_on: 'b', is_active: true, show_on_site: false, service_ids: null, service_names: null, times_used: '3' }],
      error: null,
    })
    const [p] = await adminListPromos()
    expect(p).toMatchObject({ serviceIds: [], serviceNames: [], timesUsed: 3, showOnSite: false })
  })

  it('sends every field when saving, including the website flag', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await adminSavePromo(input)
    expect(mockRpc).toHaveBeenCalledWith('admin_upsert_promo', expect.objectContaining({ p_show_on_site: true, p_service_ids: ['s1'], p_id: null }))
  })

  it('translates database errors (edge case)', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'PROMO_NO_SERVICES' } })
    await expect(adminSavePromo(input)).rejects.toThrow('Elegí al menos un servicio.')
    await expect(adminSetPromoActive('p', false)).rejects.toThrow()
    await expect(adminDeletePromo('p')).rejects.toThrow()
  })

  it('maps the active promos for the booking screen and handles no rows (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: [{ service_id: 's', promo_id: 'p', name: 'N', description: null, discount_type: 'fixed', discount_value: 100, discount_cents: 100, final_price_cents: 900, ends_on: 'x' }], error: null })
    expect((await listActivePromos())[0]).toMatchObject({ serviceId: 's', finalPriceCents: 900 })
    mockRpc.mockResolvedValue({ data: null, error: null })
    expect(await listActivePromos()).toEqual([])
  })

  it('public promos come back empty when the lookup fails (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'x' } })
    expect(await listPublicPromos()).toEqual([])
  })

  it('maps public promos with a null services list (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: [{ promo_id: 'p', name: 'N', description: null, discount_type: 'percent', discount_value: 5, ends_on: 'x', service_names: null }], error: null })
    expect((await listPublicPromos())[0].serviceNames).toEqual([])
  })
})
