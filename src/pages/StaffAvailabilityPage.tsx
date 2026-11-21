import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Tabs } from '../components/Tabs'
import { useStaffAvailabilityPermissions } from '../hooks/useStaffAvailabilityPermissions'
import { useSplitShifts } from '../hooks/useSplitShifts'
import { useStaffAvailability } from '../hooks/useStaffAvailability'
import {
  WeeklyScheduleEditor,
  ExceptionDateForm,
  ExceptionDateList,
  PermissionToggle,
} from '../components/availability'

export function StaffAvailabilityPage() {
  const split = useSplitShifts()
  const { staffId } = useParams<{ staffId: string }>()
  const [tab, setTab] = useState<'schedule' | 'days'>('schedule')
  const permissionsState = useStaffAvailabilityPermissions(staffId ?? '')
  const { permissions } = permissionsState
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

      {permissionsState.errorMessage && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {permissionsState.errorMessage}
        </div>
      )}

      <Tabs
        ariaLabel="Disponibilidad"
        active={tab}
        onChange={setTab}
        tabs={[
          { key: 'schedule', label: 'Horario semanal' },
          { key: 'days', label: 'Días libres y especiales' },
        ]}
      />

      {tab === 'schedule' && (
        <section className="space-y-4">
          {permissions && (
            <PermissionToggle
              label="Puede editar su horario"
              hint="Si lo desmarcás, este profesional ve su horario pero solo vos podés cambiarlo."
              checked={permissions.canEditSchedule}
              onChange={(allowed) => void permissionsState.setCanEditSchedule(allowed)}
            />
          )}
          {schedule.length === 0 && !isSaving ? (
            <p className="text-sm text-shell-subtleText">Este profesional no tiene horario configurado.</p>
          ) : null}
          <WeeklyScheduleEditor
            split={split}
            schedule={schedule}
            isSaving={isSaving}
            onSave={(days) => void saveSchedule(days)}
            onDirtyChange={setIsDirty}
          />
        </section>
      )}

      {tab === 'days' && (
        <section className="space-y-4">
          {permissions && (
            <PermissionToggle
              label="Puede cargar sus días libres"
              hint="Si lo desmarcás, este profesional no puede agregar ni quitar días libres o especiales."
              checked={permissions.canEditDaysOff}
              onChange={(allowed) => void permissionsState.setCanEditDaysOff(allowed)}
            />
          )}
          <ExceptionDateForm split={split} isSaving={isSaving} onAdd={(exc) => void addException(exc)} />
          <ExceptionDateList
            exceptions={exceptions}
            isSaving={isSaving}
            onRemove={(date) => void removeException(date)}
          />
        </section>
      )}
    </div>
  )
}
