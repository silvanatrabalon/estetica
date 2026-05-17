import { useState } from 'react'
import { useAppointments } from '../hooks/useAppointments'
import { AppointmentCard } from '../components/appointments/AppointmentCard'
import { WeeklyCalendar } from '../components/appointments/WeeklyCalendar'
import { MonthlyCalendar } from '../components/appointments/MonthlyCalendar'
import type { AppointmentSummary } from '../services/appointments'

type Tab = 'proximos' | 'historial'
type ViewMode = 'lista' | 'calendario'
type CalendarMode = 'semanal' | 'mensual'

function isUpcoming(apt: AppointmentSummary): boolean {
  return (
    (apt.status === 'pending' || apt.status === 'confirmed') &&
    apt.startsAt > new Date().toISOString()
  )
}

export function StaffAppointmentsPage() {
  const { appointments, loading, error, setAppointments } = useAppointments()
  const [tab, setTab] = useState<Tab>('proximos')
  const [viewMode, setViewMode] = useState<ViewMode>('lista')
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('semanal')

  const proximosApts = appointments.filter(isUpcoming)
  const historialApts = appointments.filter((apt) => !isUpcoming(apt))
  const activeApts = tab === 'proximos' ? proximosApts : historialApts

  const orgTimezone = appointments[0]?.orgTimezone ?? 'UTC'

  function handleCancelSuccess(appointmentId: string) {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt,
      ),
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-32">
        <p className="text-gray-500">Cargando turnos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>

        {/* Lista ↔ Calendario toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setViewMode('lista')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'lista'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode('calendario')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === 'calendario'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Calendario
          </button>
        </div>
      </div>

      {viewMode === 'lista' ? (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab('proximos')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === 'proximos'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Próximos
              {proximosApts.length > 0 && (
                <span className="ml-1.5 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                  {proximosApts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('historial')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === 'historial'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Historial
            </button>
          </div>

          {/* Appointment list */}
          {activeApts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {tab === 'proximos'
                  ? 'No tenés turnos asignados'
                  : 'No hay turnos en el historial'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeApts.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  showCustomerName={true}
                  showRescheduleAction={tab === 'proximos'}
                  showCancelAction={tab === 'proximos'}
                  onCancelSuccess={handleCancelSuccess}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Calendar mode sub-toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
            <button
              onClick={() => setCalendarMode('semanal')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                calendarMode === 'semanal'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setCalendarMode('mensual')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                calendarMode === 'mensual'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Mensual
            </button>
          </div>

          {calendarMode === 'semanal' ? (
            <WeeklyCalendar appointments={appointments} orgTimezone={orgTimezone} />
          ) : (
            <MonthlyCalendar appointments={appointments} orgTimezone={orgTimezone} />
          )}
        </>
      )}
    </div>
  )
}
