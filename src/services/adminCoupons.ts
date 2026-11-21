import { initSupabase } from '../lib/supabase'
import { translateCouponError, type DiscountType } from '../lib/coupons'

export interface AdminCoupon {
  id: string
  code: string
  description: string | null
  discountType: DiscountType
  /** percent: 1-100. fixed: amount in cents. */
  discountValue: number
  categoryId: string | null
  categoryName: string | null
  startsOn: string | null
  endsOn: string | null
  isActive: boolean
  showOnSite: boolean
  timesUsed: number
}

export interface CouponInput {
  id: string | null
  code: string
  description: string
  discountType: DiscountType
  discountValue: number
  categoryId: string | null
  startsOn: string | null
  endsOn: string | null
  isActive: boolean
  showOnSite: boolean
}

interface CouponRow {
  id: string
  code: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  category_id: string | null
  category_name: string | null
  starts_on: string | null
  ends_on: string | null
  is_active: boolean
  show_on_site: boolean
  times_used: number | string
}

export async function adminListCoupons(): Promise<AdminCoupon[]> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_list_coupons')
  if (error) throw new Error(translateCouponError(error.message))

  return ((data ?? []) as CouponRow[]).map((row) => ({
    id: row.id,
    code: row.code,
    description: row.description,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    categoryId: row.category_id,
    categoryName: row.category_name,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    isActive: row.is_active,
    showOnSite: row.show_on_site,
    timesUsed: Number(row.times_used),
  }))
}

export async function adminSaveCoupon(input: CouponInput): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_upsert_coupon', {
    p_id: input.id,
    p_code: input.code,
    p_description: input.description,
    p_discount_type: input.discountType,
    p_discount_value: input.discountValue,
    p_category_id: input.categoryId,
    p_starts_on: input.startsOn,
    p_ends_on: input.endsOn,
    p_is_active: input.isActive,
    p_show_on_site: input.showOnSite,
  })
  if (error) throw new Error(translateCouponError(error.message))
}

export async function adminSetCouponActive(id: string, active: boolean): Promise<void> {
  const supabase = initSupabase()
  const { error } = await supabase.rpc('admin_set_coupon_active', { p_id: id, p_active: active })
  if (error) throw new Error(translateCouponError(error.message))
}

/** Deletes the coupon, or only deactivates it when someone already used it. */
export async function adminDeleteCoupon(id: string): Promise<'deleted' | 'deactivated'> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_delete_coupon', { p_id: id })
  if (error) throw new Error(translateCouponError(error.message))
  return data === 'deactivated' ? 'deactivated' : 'deleted'
}
