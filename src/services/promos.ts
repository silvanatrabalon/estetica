import { initSupabase } from '../lib/supabase'
import { translatePromoError } from '../lib/promos'
import type { DiscountType } from '../lib/coupons'

export interface AdminPromo {
  id: string
  name: string
  description: string | null
  discountType: DiscountType
  /** percent: 1-100. fixed: amount in cents. */
  discountValue: number
  startsOn: string
  endsOn: string
  isActive: boolean
  /** Also shown in the Promociones section of the website. */
  showOnSite: boolean
  serviceIds: string[]
  serviceNames: string[]
  /** Appointments booked with the promo that were not cancelled. */
  timesUsed: number
}

export interface PromoInput {
  id: string | null
  name: string
  description: string
  discountType: DiscountType
  discountValue: number
  startsOn: string
  endsOn: string
  isActive: boolean
  showOnSite: boolean
  serviceIds: string[]
}

interface PromoRow {
  id: string
  name: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  starts_on: string
  ends_on: string
  is_active: boolean
  show_on_site: boolean
  service_ids: string[] | null
  service_names: string[] | null
  times_used: number | string
}

export async function adminListPromos(): Promise<AdminPromo[]> {
  const { data, error } = await initSupabase().rpc('admin_list_promos')
  if (error) throw new Error(translatePromoError(error.message))
  return ((data ?? []) as PromoRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    isActive: row.is_active,
    showOnSite: row.show_on_site,
    serviceIds: row.service_ids ?? [],
    serviceNames: row.service_names ?? [],
    timesUsed: Number(row.times_used),
  }))
}

export async function adminSavePromo(input: PromoInput): Promise<void> {
  const { error } = await initSupabase().rpc('admin_upsert_promo', {
    p_id: input.id,
    p_name: input.name,
    p_description: input.description,
    p_discount_type: input.discountType,
    p_discount_value: input.discountValue,
    p_starts_on: input.startsOn,
    p_ends_on: input.endsOn,
    p_is_active: input.isActive,
    p_service_ids: input.serviceIds,
    p_show_on_site: input.showOnSite,
  })
  if (error) throw new Error(translatePromoError(error.message))
}

export async function adminSetPromoActive(id: string, active: boolean): Promise<void> {
  const { error } = await initSupabase().rpc('admin_set_promo_active', { p_id: id, p_active: active })
  if (error) throw new Error(translatePromoError(error.message))
}

/** Deletes the promo. Appointments already booked with it keep their discount. */
export async function adminDeletePromo(id: string): Promise<void> {
  const { error } = await initSupabase().rpc('admin_delete_promo', { p_id: id })
  if (error) throw new Error(translatePromoError(error.message))
}

/** A promo that applies today to a service, as the booking screen needs it. */
export interface ActivePromo {
  serviceId: string
  promoId: string
  name: string
  description: string | null
  discountType: DiscountType
  discountValue: number
  discountCents: number
  finalPriceCents: number
  endsOn: string
}

interface ActivePromoRow {
  service_id: string
  promo_id: string
  name: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  discount_cents: number
  final_price_cents: number
  ends_on: string
}

/** The services that have a promo today. */
export async function listActivePromos(): Promise<ActivePromo[]> {
  const { data, error } = await initSupabase().rpc('list_active_promos')
  if (error) throw new Error(error.message)
  return ((data ?? []) as ActivePromoRow[]).map((row) => ({
    serviceId: row.service_id,
    promoId: row.promo_id,
    name: row.name,
    description: row.description,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    discountCents: row.discount_cents,
    finalPriceCents: row.final_price_cents,
    endsOn: row.ends_on,
  }))
}

/** A promo shown in the Promociones section of the website. */
export interface PublicPromo {
  promoId: string
  name: string
  description: string | null
  discountType: DiscountType
  discountValue: number
  endsOn: string
  serviceNames: string[]
  serviceIds: string[]
}

/** Promos the admin chose to show on the website. Empty if the lookup fails. */
export async function listPublicPromos(): Promise<PublicPromo[]> {
  const { data, error } = await initSupabase().rpc('list_public_promos')
  if (error) return []
  return ((data ?? []) as Array<{
    promo_id: string
    name: string
    description: string | null
    discount_type: DiscountType
    discount_value: number
    ends_on: string
    service_names: string[] | null
    service_ids: string[] | null
  }>).map((row) => ({
    promoId: row.promo_id,
    name: row.name,
    description: row.description,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    endsOn: row.ends_on,
    serviceNames: row.service_names ?? [],
    serviceIds: row.service_ids ?? [],
  }))
}
