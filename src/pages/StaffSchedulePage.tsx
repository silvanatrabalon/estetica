import { useMyStaffAvailability } from '../hooks/useMyStaffAvailability'
import {
  WeeklyScheduleEditor,
  ExceptionDateForm,
  ExceptionDateList,
} from '../components/availability'

export function StaffSchedulePage() {
  const {
    status,
    schedule,
    exceptions,
    isSaving,
    errorMessage,
    successMessage,
    saveSchedule,
    addException,
    removeException,
    setIsDirty,
  } = useMyStaffAvailability()

  if (status === 'loading') {
    return (
      <div className="p-6">
        <p className="text-gray-500">Cargando tu disponibilidad...</p>
      </div>
    )
  }

  if (status === 'not-staff') {
    return (
      <div className="p-6">
        <p className="text-gray-500">
          No tenés un perfil de profesional activo. Contactá al administrador.
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="p-6">
        <p className="text-red-600">
          No pudimos cargar tu disponibilidad. Recargá la página e intentá de nuevo.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Mi disponibilidad</h1>

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
            Todavía no tenés un horario configurado.
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
