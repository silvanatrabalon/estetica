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
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/staff')}
          className="text-sm text-shell-subtleText hover:text-shell-text inline-flex items-center gap-1 transition-colors"
        >
          ← Profesionales
        </button>
        <span className="text-shell-subtleText">/</span>
        <h1 className="font-heading text-xl font-semibold text-shell-text">Disponibilidad</h1>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-start gap-2">
          <span className="shrink-0 mt-0.5">✓</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Weekly schedule */}
      <section className="shell-surface rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-shell-border bg-shell-muted/20">
          <h2 className="font-heading text-base font-semibold text-shell-text">Horario semanal</h2>
          <p className="text-xs text-shell-subtleText mt-0.5">Configurá los días y horarios habituales de trabajo.</p>
        </div>
        <div className="p-5">
          {schedule.length === 0 && !isSaving ? (
            <p className="text-sm text-shell-subtleText mb-3">
              Este profesional no tiene horario configurado.
            </p>
          ) : null}
          <WeeklyScheduleEditor
            schedule={schedule}
            isSaving={isSaving}
            onSave={(days) => void saveSchedule(days)}
            onDirtyChange={setIsDirty}
          />
        </div>
      </section>

      {/* Exceptions */}
      <section className="shell-surface rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-shell-border bg-shell-muted/20">
          <h2 className="font-heading text-base font-semibold text-shell-text">Excepciones</h2>
          <p className="text-xs text-shell-subtleText mt-0.5">Días libres o con horario especial fuera de la rutina semanal.</p>
        </div>
        <div className="p-5 space-y-4">
          <ExceptionDateForm
            isSaving={isSaving}
            onAdd={(exc) => void addException(exc)}
          />
          <ExceptionDateList
            exceptions={exceptions}
            isSaving={isSaving}
            onRemove={(date) => void removeException(date)}
          />
        </div>
      </section>
    </div>
  )
}
