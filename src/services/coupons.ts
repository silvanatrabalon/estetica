import { initSupabase } from '../lib/supabase'
import { translateCouponError, type DiscountType } from '../lib/coupons'

export interface CouponCheck {
  discountCents: number
  finalPriceCents: number
}

/** Checks a code for a service as the logged-in client. Throws a Spanish message when it cannot be used. */
export async function validateCoupon(serviceId: string, code: string): Promise<CouponCheck> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('validate_coupon', { p_service_id: serviceId, p_code: code })
  if (error) throw new Error(translateCouponError(error.message))

  const row = ((data ?? []) as Array<{ discount_cents: number; final_price_cents: number }>)[0]
  if (!row) throw new Error(translateCouponError('COUPON_NOT_FOUND'))

  return { discountCents: Number(row.discount_cents), finalPriceCents: Number(row.final_price_cents) }
}

export interface PublicCoupon {
  code: string
  description: string | null
  discountType: DiscountType
  discountValue: number
  categoryName: string | null
  endsOn: string | null
}

/** Coupons the admin chose to show on the website. Empty if the lookup fails. */
export async function listPublicCoupons(): Promise<PublicCoupon[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('list_public_coupons')
  if (error) return []

  return ((data ?? []) as Array<{
    code: string
    description: string | null
    discount_type: DiscountType
    discount_value: number
    category_name: string | null
    ends_on: string | null
  }>).map((row) => ({
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    categoryName: row.category_name,
    endsOn: row.ends_on,
  }))
}
