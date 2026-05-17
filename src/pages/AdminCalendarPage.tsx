import { useState, useEffect, useCallback } from 'react'
import { adminListAppointments } from '../services/adminAppointments'
import { WeeklyCalendar } from '../components/appointments/WeeklyCalendar'
import type { AppointmentSummary } from '../services/appointments'
import type { AdminAppointmentRow } from '../services/adminAppointments'

/** Maps an AdminAppointmentRow to the shape WeeklyCalendar expects */
function toAppointmentSummary(row: AdminAppointmentRow): AppointmentSummary {
  return {
    id: row.id,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    status: row.status,
    createdAt: row.createdAt,
    customerUserId: '',
    serviceId: row.serviceId,
    serviceName: row.serviceName,
    serviceDurationMinutes: 0,
    servicePriceCents: 0,
    staffDisplayName: row.staffDisplayName,
    orgName: '',
    orgTimezone: 'UTC',
    customerName: row.customerName,
  }
}

/** Returns the Monday (UTC) of the week containing the given date */
function getUTCMonday(date: Date): Date {
  const day = date.getUTCDay()
  const offset = day === 0 ? -6 : 1 - day
  return new Date(date.getTime() + offset * 86400000)
}

function addUTCDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86400000)
}

function toISODateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function AdminCalendarPage() {
  const [weekStart, setWeekStart] = useState(() => getUTCMonday(new Date()))
  const [appointments, setAppointments] = useState<AdminAppointmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const weekEnd = addUTCDays(weekStart, 6)
  const dateFrom = weekStart.toISOString()
  const dateTo = `${toISODateString(weekEnd)}T23:59:59Z`

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { rows } = await adminListAppointments(
        { dateFrom, dateTo },
        1,
        200,
      )
      setAppointments(rows)
    } catch {
      setError('Ocurrió un error al cargar el calendario.')
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  function handleRescheduleSuccess(appointmentId: string, newStartsAt: string) {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, startsAt: newStartsAt } : apt,
      ),
    )
  }

  function handleWeekChange(newWeekStart: Date) {
    setWeekStart(newWeekStart)
  }

  // Org timezone from first appointment (all from same org)
  const orgTimezone = 'UTC' // Admin calendar uses UTC display; org timezone not available in admin row

  const summaries = appointments.map(toAppointmentSummary)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Calendario</h2>
      </div>

      {loading && (
        <div className="flex items-center justify-center min-h-32">
          <p className="text-gray-500">Cargando turnos...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && appointments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay turnos esta semana.</p>
        </div>
      )}

      {!loading && !error && (
        <WeeklyCalendar
          appointments={summaries}
          orgTimezone={orgTimezone}
          currentDate={weekStart}
          showCustomerName={true}
          onRescheduleSuccess={handleRescheduleSuccess}
          onWeekChange={handleWeekChange}
        />
      )}
    </div>
  )
}
