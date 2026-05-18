import { initSupabase } from '../lib/supabase'

export interface AdminDashboardStats {
  todayCount: number
  weekCount: number
  monthCount: number
  pendingCount: number
  confirmedCount: number
  cancelledCount: number
  completedCount: number
  noShowCount: number
  // NOTE: price-at-query — reflects current services.price_cents at call time.
  // If service prices have changed since the appointment was booked, this value
  // is approximate. There is no total_price_cents snapshot on appointments in MVP.
  revenueCentsMonth: number
}

interface AdminDashboardStatsRpcRow {
  today_count: number
  week_count: number
  month_count: number
  pending_count: number
  confirmed_count: number
  cancelled_count: number
  completed_count: number
  no_show_count: number
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
    monthCount: Number(row.month_count),
    pendingCount: Number(row.pending_count),
    confirmedCount: Number(row.confirmed_count),
    cancelledCount: Number(row.cancelled_count),
    completedCount: Number(row.completed_count),
    noShowCount: Number(row.no_show_count),
    revenueCentsMonth: Number(row.revenue_cents_month),
  }
}
