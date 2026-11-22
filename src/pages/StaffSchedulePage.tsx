import { useState } from 'react'
import { Tabs } from '../components/Tabs'
import { ConfirmModal } from '../components/ConfirmModal'
import { useBeforeUnloadWarning } from '../hooks/useBeforeUnloadWarning'
import { useSplitShifts } from '../hooks/useSplitShifts'
import { useMyStaffAvailability } from '../hooks/useMyStaffAvailability'
import {
  WeeklyScheduleEditor,
  ExceptionDateForm,
  ExceptionDateList,
} from '../components/availability'

export function StaffSchedulePage() {
  const split = useSplitShifts()
  const [tab, setTab] = useState<'schedule' | 'days'>('schedule')
  const {
    status,
    canEdit,
    canEditDaysOff,
    schedule,
    exceptions,
    isSaving,
    errorMessage,
    successMessage,
    saveSchedule,
    addException,
    removeException,
    isDirty,
    setIsDirty,
  } = useMyStaffAvailability()

  // The weekly schedule is only saved with "Guardar horario": changing section asks first
  const [pendingTab, setPendingTab] = useState<'schedule' | 'days' | null>(null)
  useBeforeUnloadWarning(isDirty)

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
      <h1 className="text-2xl font-semibold text-gray-900 mb-3">Mi disponibilidad</h1>
      <p className="mb-6 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
        <strong className="font-semibold text-gray-900">Esto define los turnos que ve el cliente.</strong> Los clientes
        solo pueden reservar con vos en los días y horarios que figuran acá. Si un día o una franja no está, no aparece
        para reservar; tus días libres y especiales también quitan o cambian esos turnos.
      </p>

      {errorMessage && (
        <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div role="status" className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {successMessage}
        </div>
      )}

      <div className="mb-4">
        <Tabs
          ariaLabel="Mi disponibilidad"
          active={tab}
          onChange={(next) => {
            if (next === tab) return
            if (isDirty) setPendingTab(next)
            else setTab(next)
          }}
          tabs={[
            { key: 'schedule', label: 'Horario semanal' },
            { key: 'days', label: 'Días libres y especiales' },
          ]}
        />
      </div>

      {tab === 'schedule' && (
        <section>
          {!canEdit && (
            <div role="status" className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
              Tu administrador define tus horarios. Podés verlos acá, pero no modificarlos.
            </div>
          )}
          {schedule.length === 0 && !isSaving ? (
            <p className="text-sm text-gray-500 mb-3">
              {canEdit ? 'Todavía no tenés un horario configurado.' : 'Todavía no tenés un horario configurado. Pedíselo a tu administrador.'}
            </p>
          ) : null}
          <WeeklyScheduleEditor
            split={split}
            schedule={schedule}
            isSaving={isSaving}
            onSave={(days) => void saveSchedule(days)}
            onDirtyChange={setIsDirty}
            readOnly={!canEdit}
          />
        </section>
      )}

      {tab === 'days' && (
        <section>
          {!canEditDaysOff && (
            <div role="status" className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
              Tu administrador carga tus días libres. Podés verlos acá, pero no modificarlos.
            </div>
          )}
          {canEditDaysOff && (
            <div className="mb-4">
              <ExceptionDateForm split={split} isSaving={isSaving} onAdd={(exc) => void addException(exc)} />
            </div>
          )}
          <ExceptionDateList
            exceptions={exceptions}
            isSaving={isSaving}
            onRemove={(date) => void removeException(date)}
            readOnly={!canEditDaysOff}
          />
        </section>
      )}

      <ConfirmModal
        isOpen={pendingTab !== null}
        title="Tenés cambios sin guardar"
        message="Los cambios del horario semanal no se guardan solos. Volvé y apretá “Guardar horario”, o se pierden."
        confirmLabel="Salir sin guardar"
        cancelLabel="Volver y guardar"
        destructive
        onConfirm={() => {
          const next = pendingTab
          setPendingTab(null)
          setIsDirty(false)
          if (next) setTab(next)
        }}
        onCancel={() => setPendingTab(null)}
      />
    </div>
  )
}
