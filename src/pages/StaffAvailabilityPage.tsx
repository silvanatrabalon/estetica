import { useParams, useNavigate } from 'react-router-dom'
import { useStaffAvailability } from '../hooks/useStaffAvailability'
import {
  WeeklyScheduleEditor,
  ExceptionDateForm,
  ExceptionDateList,
} from '../components/availability'

export function StaffAvailabilityPage() {
  const { staffId } = useParams<{ staffId: string }>()
  const navigate = useNavigate()

  const {
    schedule,
    exceptions,
    isLoading,
    isSaving,
    errorMessage,
    successMessage,
    saveSchedule,
    addException,
    removeException,
    setIsDirty,
  } = useStaffAvailability(staffId ?? '')

  if (!staffId) {
    return (
      <div className="p-6">
        <p className="text-red-600">Profesional no encontrado.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando disponibilidad...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/staff')}
          className="text-sm text-shell-subtleText hover:text-shell-text inline-flex items-center gap-1 transition-colors"
        >
          ← Profesionales
        </button>
        <h1 className="font-heading text-2xl font-semibold text-shell-text">Disponibilidad</h1>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <section className="shell-surface rounded-2xl border p-5 shadow-sm">
        <h2 className="font-heading text-base font-semibold text-shell-text mb-4">Horario semanal</h2>
        {schedule.length === 0 && !isSaving ? (
          <p className="text-sm text-gray-500 mb-3">
            Este profesional no tiene horario configurado.
          </p>
        ) : null}
        <WeeklyScheduleEditor
          schedule={schedule}
          isSaving={isSaving}
          onSave={(days) => void saveSchedule(days)}
          onDirtyChange={setIsDirty}
        />
      </section>

      <section className="shell-surface rounded-2xl border p-5 shadow-sm">
        <h2 className="font-heading text-base font-semibold text-shell-text mb-4">Excepciones</h2>
        <div className="mb-4">
          <ExceptionDateForm
            isSaving={isSaving}
            onAdd={(exc) => void addException(exc)}
          />
        </div>
        <ExceptionDateList
          exceptions={exceptions}
          isSaving={isSaving}
          onRemove={(date) => void removeException(date)}
        />
      </section>
    </div>
  )
}
