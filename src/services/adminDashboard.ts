import { initSupabase } from '../lib/supabase'

export interface AdminDashboardStats {
  todayCount: number
  weekCount: number
  /** Pending or confirmed appointments from now on. */
  upcomingCount: number
  monthCount: number
  pendingCount: number
  confirmedCount: number
  cancelledCount: number
  completedCount: number
  // NOTE: price-at-query — reflects current services.price_cents at call time.
  // If service prices have changed since the appointment was booked, this value
  // is approximate. There is no total_price_cents snapshot on appointments in MVP.
  revenueCentsMonth: number
}

interface AdminDashboardStatsRpcRow {
  today_count: number
  week_count: number
  upcoming_count?: number
  month_count: number
  pending_count: number
  confirmed_count: number
  cancelled_count: number
  completed_count: number
  revenue_cents_month: number
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = initSupabase()

  const { data, error } = await supabase.rpc('admin_get_dashboard_stats')

  if (error) {
    throw new Error(error.message)
  }

  const row = (data as AdminDashboardStatsRpcRow[] | null)?.[0]

  if (!row) {
    throw new Error('No se recibieron estadísticas del servidor.')
  }

  return {
    todayCount: Number(row.today_count),
    weekCount: Number(row.week_count),
    upcomingCount: Number(row.upcoming_count ?? 0),
    monthCount: Number(row.month_count),
    pendingCount: Number(row.pending_count),
    confirmedCount: Number(row.confirmed_count),
    cancelledCount: Number(row.cancelled_count),
    completedCount: Number(row.completed_count),
    revenueCentsMonth: Number(row.revenue_cents_month),
  }
}

// ── Date-range analytics ─────────────────────────────────────────────────────

export interface StatsByRange {
  pendingCount: number
  confirmedCount: number
  cancelledCount: number
  completedCount: number
  totalCount: number
  revenueCents: number
}

interface StatsByRangeRpcRow {
  pending_count: number
  confirmed_count: number
  cancelled_count: number
  completed_count: number
  total_count: number
  revenue_cents: number
}

export async function getStatsByRange(
  dateFrom: string,
  dateTo: string,
): Promise<StatsByRange> {
  const supabase = initSupabase()

  const { data, error } = await supabase.rpc('admin_get_stats_by_range', {
    p_date_from: new Date(`${dateFrom}T00:00:00`).toISOString(),
    p_date_to: new Date(`${dateTo}T23:59:59`).toISOString(),
  })

  if (error) {
    throw new Error(error.message)
  }

  const row = (data as StatsByRangeRpcRow[] | null)?.[0]

  if (!row) {
    throw new Error('No se recibieron estadísticas del servidor.')
  }

  return {
    pendingCount: Number(row.pending_count),
    confirmedCount: Number(row.confirmed_count),
    cancelledCount: Number(row.cancelled_count),
    completedCount: Number(row.completed_count),
    totalCount: Number(row.total_count),
    revenueCents: Number(row.revenue_cents),
  }
}
