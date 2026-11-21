import { initSupabase } from '../lib/supabase'

export interface StatsProfessional {
  staffMemberId: string
  displayName: string
  services: number
  revenueCents: number
}

export interface StatsMonth {
  /** YYYY-MM */
  month: string
  services: number
  revenueCents: number
}

export interface StatsClient {
  customerUserId: string
  name: string
  visits: number
  spentCents: number
}

export interface AdminStats {
  totals: { services: number; revenueCents: number; clients: number }
  professionals: StatsProfessional[]
  months: StatsMonth[]
  clients: StatsClient[]
}

interface StatsPayload {
  totals?: { services?: number | string; revenue_cents?: number | string; clients?: number | string }
  professionals?: Array<{ staff_member_id: string; display_name: string; services: number | string; revenue_cents: number | string }>
  months?: Array<{ month: string; services: number | string; revenue_cents: number | string }>
  clients?: Array<{ customer_user_id: string; name: string; visits: number | string; spent_cents: number | string }>
}

/** Services done, income and top clients. Only appointments that already took place count. */
export async function getAdminStats(from: string | null, to: string | null): Promise<AdminStats> {
  const supabase = initSupabase()
  const { data, error } = await supabase.rpc('admin_get_stats', { p_from: from, p_to: to })
  if (error) throw new Error(error.message)

  const payload = (data ?? {}) as StatsPayload
  return {
    totals: {
      services: Number(payload.totals?.services ?? 0),
      revenueCents: Number(payload.totals?.revenue_cents ?? 0),
      clients: Number(payload.totals?.clients ?? 0),
    },
    professionals: (payload.professionals ?? []).map((p) => ({
      staffMemberId: p.staff_member_id,
      displayName: p.display_name,
      services: Number(p.services),
      revenueCents: Number(p.revenue_cents),
    })),
    months: (payload.months ?? []).map((m) => ({
      month: m.month,
      services: Number(m.services),
      revenueCents: Number(m.revenue_cents),
    })),
    clients: (payload.clients ?? []).map((c) => ({
      customerUserId: c.customer_user_id,
      name: c.name,
      visits: Number(c.visits),
      spentCents: Number(c.spent_cents),
    })),
  }
}
