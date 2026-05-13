import { useState } from 'react'
import type { StaffScheduleDay } from '../../services/staffAvailability'
import type { StaffScheduleDayInput } from '../../services/staffAvailability'
import { DayScheduleRow } from './DayScheduleRow'

// Build an editable draft from the loaded schedule rows.
// For any day not in the loaded data, default to not working.
function buildDraft(loaded: StaffScheduleDay[]): StaffScheduleDayInput[] {
  return Array.from({ length: 7 }, (_, i) => {
    const existing = loaded.find((d) => d.dayOfWeek === i)
    return {
      day_of_week: i,
      is_working: existing?.isWorking ?? false,
      starts_at: existing?.startsAt ?? '09:00',
      ends_at: existing?.endsAt ?? '18:00',
    }
  })
}

interface WeeklyScheduleEditorProps {
  schedule: StaffScheduleDay[]
  isSaving: boolean
  onSave: (days: StaffScheduleDayInput[]) => void
  onDirtyChange: (dirty: boolean) => void
}

export function WeeklyScheduleEditor({
  schedule,
  isSaving,
  onSave,
  onDirtyChange,
}: WeeklyScheduleEditorProps) {
  const [draft, setDraft] = useState<StaffScheduleDayInput[]>(() => buildDraft(schedule))
  const [timeErrors, setTimeErrors] = useState<Record<number, string | null>>({})

  const updateDay = (dayOfWeek: number, patch: Partial<StaffScheduleDayInput>) => {
    setDraft((current) => {
      const updated = current.map((d) =>
        d.day_of_week === dayOfWeek ? { ...d, ...patch } : d,
      )
      return updated
    })
    onDirtyChange(true)

    // Clear time error for the day when user edits
    if (patch.starts_at !== undefined || patch.ends_at !== undefined) {
      setTimeErrors((current) => ({ ...current, [dayOfWeek]: null }))
    }
  }

  const validate = (): boolean => {
    const errors: Record<number, string | null> = {}
    let valid = true

    for (const day of draft) {
      if (day.is_working) {
        if (!day.starts_at || !day.ends_at) {
          errors[day.day_of_week] = 'Ingresá la hora de inicio y fin.'
          valid = false
        } else if (day.starts_at >= day.ends_at) {
          errors[day.day_of_week] = 'La hora de inicio debe ser anterior a la hora de fin.'
          valid = false
        } else {
          errors[day.day_of_week] = null
        }
      }
    }

    setTimeErrors(errors)
    return valid
  }

  const handleSave = () => {
    if (!validate()) return
    onSave(draft)
  }

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-md divide-y divide-gray-100">
        {draft.map((day) => (
          <DayScheduleRow
            key={day.day_of_week}
            dayOfWeek={day.day_of_week}
            isWorking={day.is_working}
            startsAt={day.starts_at ?? '09:00'}
            endsAt={day.ends_at ?? '18:00'}
            disabled={isSaving}
            onIsWorkingChange={(value) => {
              updateDay(day.day_of_week, {
                is_working: value,
                starts_at: value ? (day.starts_at ?? '09:00') : null,
                ends_at: value ? (day.ends_at ?? '18:00') : null,
              })
            }}
            onStartsAtChange={(value) => updateDay(day.day_of_week, { starts_at: value })}
            onEndsAtChange={(value) => updateDay(day.day_of_week, { ends_at: value })}
            timeError={timeErrors[day.day_of_week]}
          />
        ))}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Guardar horario'}
        </button>
      </div>
    </div>
  )
}
