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
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/admin/staff')}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Profesionales
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Disponibilidad</h1>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {successMessage}
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-medium text-gray-800 mb-3">Horario semanal</h2>
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

      <section>
        <h2 className="text-lg font-medium text-gray-800 mb-3">Excepciones</h2>
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
