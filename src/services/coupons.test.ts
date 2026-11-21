import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listPublicCoupons, validateCoupon } from './coupons'
import { adminDeleteCoupon, adminListCoupons, adminSaveCoupon } from './adminCoupons'

const mockRpc = vi.fn()
vi.mock('../lib/supabase', () => ({ initSupabase: () => ({ rpc: mockRpc }) }))

describe('validateCoupon', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the discount and the final price', async () => {
    mockRpc.mockResolvedValue({ data: [{ coupon_id: 'c', discount_cents: 100, final_price_cents: 900 }], error: null })
    expect(await validateCoupon('svc', 'VERANO10')).toEqual({ discountCents: 100, finalPriceCents: 900 })
    expect(mockRpc).toHaveBeenCalledWith('validate_coupon', { p_service_id: 'svc', p_code: 'VERANO10' })
  })

  it('translates database errors into Spanish (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'COUPON_EXPIRED' } })
    await expect(validateCoupon('svc', 'X')).rejects.toThrow('Ese cupón ya venció.')
  })

  it('an empty answer is treated as an unknown coupon (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null })
    await expect(validateCoupon('svc', 'X')).rejects.toThrow('Ese cupón no existe')
  })
})

describe('listPublicCoupons', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps rows', async () => {
    mockRpc.mockResolvedValue({
      data: [{ code: 'A1B', description: null, discount_type: 'percent', discount_value: 10, category_name: 'Uñas', ends_on: null }],
      error: null,
    })
    expect(await listPublicCoupons()).toEqual([
      { code: 'A1B', description: null, discountType: 'percent', discountValue: 10, categoryName: 'Uñas', endsOn: null },
    ])
  })

  it('returns an empty list when the lookup fails, so the public page never breaks (edge case)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'down' } })
    expect(await listPublicCoupons()).toEqual([])
  })
})

describe('admin coupon services', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists coupons converting the usage count to a number', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          id: 'c1', code: 'A1B', description: null, discount_type: 'fixed', discount_value: 5000, category_id: null,
          category_name: null, starts_on: null, ends_on: null, is_active: true, show_on_site: false, times_used: '3',
        },
      ],
      error: null,
    })
    const [c] = await adminListCoupons()
    expect(c.timesUsed).toBe(3)
    expect(c.discountType).toBe('fixed')
  })

  it('sends every field to the upsert RPC', async () => {
    mockRpc.mockResolvedValue({ error: null })
    await adminSaveCoupon({
      id: null, code: 'A1B', description: 'x', discountType: 'percent', discountValue: 10, categoryId: null,
      startsOn: null, endsOn: '2026-12-31', isActive: true, showOnSite: true,
    })
    expect(mockRpc).toHaveBeenCalledWith('admin_upsert_coupon', {
      p_id: null, p_code: 'A1B', p_description: 'x', p_discount_type: 'percent', p_discount_value: 10,
      p_category_id: null, p_starts_on: null, p_ends_on: '2026-12-31', p_is_active: true, p_show_on_site: true,
    })
  })

  it('translates a taken code (edge case)', async () => {
    mockRpc.mockResolvedValue({ error: { message: 'COUPON_CODE_TAKEN' } })
    await expect(
      adminSaveCoupon({
        id: null, code: 'A1B', description: '', discountType: 'percent', discountValue: 10, categoryId: null,
        startsOn: null, endsOn: null, isActive: true, showOnSite: false,
      }),
    ).rejects.toThrow('Ya existe un cupón con ese código.')
  })

  it('delete reports whether it was removed or only deactivated', async () => {
    mockRpc.mockResolvedValueOnce({ data: 'deleted', error: null })
    expect(await adminDeleteCoupon('c1')).toBe('deleted')
    mockRpc.mockResolvedValueOnce({ data: 'deactivated', error: null })
    expect(await adminDeleteCoupon('c1')).toBe('deactivated')
  })
})
