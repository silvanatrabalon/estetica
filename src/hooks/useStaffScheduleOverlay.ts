import { useState, useEffect } from 'react'
import { initSupabase } from '../lib/supabase'
import type { StaffScheduleDay, StaffScheduleException } from '../services/staffAvailability'

interface UseStaffScheduleOverlayResult {
  scheduleByDay: Record<number, StaffScheduleDay | null>
  exceptionsByDate: Record<string, StaffScheduleException>
  loading: boolean
  error: string | null
}

function toUTCDateString(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Fetches staff schedule (weekly) and exceptions for the given week.
 *
 * @param staffMemberId - UUID of the staff member (or null to skip)
 * @param weekStart - Date representing the start (Monday) of the week to display
 */
export function useStaffScheduleOverlay(
  staffMemberId: string | null,
  weekStart: Date,
): UseStaffScheduleOverlayResult {
  const [scheduleByDay, setScheduleByDay] = useState<Record<number, StaffScheduleDay | null>>({})
  const [exceptionsByDate, setExceptionsByDate] = useState<
    Record<string, StaffScheduleException>
  >({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const weekStartKey = toUTCDateString(weekStart)

  useEffect(() => {
    if (!staffMemberId) {
      setScheduleByDay({})
      setExceptionsByDate({})
      return
    }

    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const supabase = initSupabase()

        // Week date range for exceptions (7 days from weekStart)
        const weekEndDate = new Date(weekStart.getTime() + 6 * 86400000)
        const weekStartStr = weekStartKey
        const weekEndStr = toUTCDateString(weekEndDate)

        const [schedulesResult, exceptionsResult] = await Promise.all([
          supabase
            .from('staff_schedules')
            .select('*')
            .eq('staff_member_id', staffMemberId)
            .order('day_of_week'),
          supabase
            .from('staff_schedule_exceptions')
            .select('*')
            .eq('staff_member_id', staffMemberId)
            .gte('exception_date', weekStartStr)
            .lte('exception_date', weekEndStr),
        ])

        if (cancelled) return

        if (schedulesResult.error) throw schedulesResult.error
        if (exceptionsResult.error) throw exceptionsResult.error

        // Build scheduleByDay: day_of_week (0=Sun) → StaffScheduleDay | null
        const byDay: Record<number, StaffScheduleDay | null> = {}
        for (const row of (schedulesResult.data ?? []) as Array<{
          id: string
          staff_member_id: string
          day_of_week: number
          is_working: boolean
          starts_at: string | null
          ends_at: string | null
          created_at: string
          updated_at: string
        }>) {
          byDay[row.day_of_week] = {
            id: row.id,
            staffMemberId: row.staff_member_id,
            dayOfWeek: row.day_of_week,
            isWorking: row.is_working,
            startsAt: row.starts_at,
            endsAt: row.ends_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }
        }

        // Build exceptionsByDate: "YYYY-MM-DD" → StaffScheduleException
        const byDate: Record<string, StaffScheduleException> = {}
        for (const row of (exceptionsResult.data ?? []) as Array<{
          id: string
          staff_member_id: string
          exception_date: string
          exception_type: 'day_off' | 'custom_hours'
          starts_at: string | null
          ends_at: string | null
          reason: string | null
          created_at: string
          updated_at: string
        }>) {
          byDate[row.exception_date] = {
            id: row.id,
            staffMemberId: row.staff_member_id,
            exceptionDate: row.exception_date,
            exceptionType: row.exception_type,
            startsAt: row.starts_at,
            endsAt: row.ends_at,
            reason: row.reason,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }
        }

        setScheduleByDay(byDay)
        setExceptionsByDate(byDate)
      } catch {
        if (!cancelled) {
          setError('Error al cargar la disponibilidad del profesional.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffMemberId, weekStartKey])

  return { scheduleByDay, exceptionsByDate, loading, error }
}
