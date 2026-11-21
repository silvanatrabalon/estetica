import { useState } from 'react'
import type { StaffScheduleDay } from '../../services/staffAvailability'
import type { StaffScheduleDayInput } from '../../services/staffAvailability'
import {
  DEFAULT_AFTERNOON,
  DEFAULT_CONTINUOUS,
  DEFAULT_MORNING,
  collapseShifts,
  toDayShifts,
  validateShifts,
  type DayShifts,
} from '../../lib/shifts'
import { DayScheduleRow } from './DayScheduleRow'

interface DayDraft {
  dayOfWeek: number
  isWorking: boolean
  shifts: DayShifts
}

function defaultShifts(split: boolean): DayShifts {
  return split
    ? { am: DEFAULT_MORNING, pm: DEFAULT_AFTERNOON }
    : { am: DEFAULT_CONTINUOUS, pm: null }
}

// Build an editable draft from the loaded schedule rows.
// For any day not in the loaded data, default to not working.
function buildDraft(loaded: StaffScheduleDay[], split: boolean): DayDraft[] {
  return Array.from({ length: 7 }, (_, i) => {
    const existing = loaded.find((d) => d.dayOfWeek === i)
    const loadedShifts = toDayShifts(
      existing?.startsAt,
      existing?.endsAt,
      existing?.pmStartsAt,
      existing?.pmEndsAt,
    )
    const hasLoaded = loadedShifts.am !== null || loadedShifts.pm !== null
    const shifts = hasLoaded ? loadedShifts : defaultShifts(split)
    return {
      dayOfWeek: i,
      isWorking: existing?.isWorking ?? false,
      shifts: split ? shifts : collapseShifts(shifts),
    }
  })
}

function toInput(day: DayDraft): StaffScheduleDayInput {
  return {
    day_of_week: day.dayOfWeek,
    is_working: day.isWorking,
    starts_at: day.isWorking ? (day.shifts.am?.start ?? null) : null,
    ends_at: day.isWorking ? (day.shifts.am?.end ?? null) : null,
    pm_starts_at: day.isWorking ? (day.shifts.pm?.start ?? null) : null,
    pm_ends_at: day.isWorking ? (day.shifts.pm?.end ?? null) : null,
  }
}

interface WeeklyScheduleEditorProps {
  schedule: StaffScheduleDay[]
  isSaving: boolean
  onSave: (days: StaffScheduleDayInput[]) => void
  onDirtyChange: (dirty: boolean) => void
  /** true when the business works in two shifts (matutino / vespertino). */
  split?: boolean
  /** View only: inputs are disabled and the save button is hidden. */
  readOnly?: boolean
}

export function WeeklyScheduleEditor({
  schedule,
  isSaving,
  onSave,
  onDirtyChange,
  split = false,
  readOnly = false,
}: WeeklyScheduleEditorProps) {
  const [draft, setDraft] = useState<DayDraft[]>(() => buildDraft(schedule, split))
  const [timeErrors, setTimeErrors] = useState<Record<number, string | null>>({})

  const updateDay = (dayOfWeek: number, patch: Partial<DayDraft>) => {
    setDraft((current) => current.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)))
    onDirtyChange(true)

    // Clear time error for the day when user edits
    if (patch.shifts !== undefined) {
      setTimeErrors((current) => ({ ...current, [dayOfWeek]: null }))
    }
  }

  const validate = (): boolean => {
    const errors: Record<number, string | null> = {}
    let valid = true

    for (const day of draft) {
      if (!day.isWorking) continue
      const error = validateShifts(day.shifts)
      errors[day.dayOfWeek] = error
      if (error) valid = false
    }

    setTimeErrors(errors)
    return valid
  }

  const handleSave = () => {
    if (!validate()) return
    onSave(draft.map(toInput))
  }

  return (
    <div>
      <div className="rounded-2xl border border-shell-border overflow-hidden divide-y divide-shell-border">
        {draft.map((day) => (
          <DayScheduleRow
            key={day.dayOfWeek}
            dayOfWeek={day.dayOfWeek}
            isWorking={day.isWorking}
            shifts={day.shifts}
            split={split}
            disabled={isSaving || readOnly}
            onIsWorkingChange={(value) => {
              const hasShifts = day.shifts.am !== null || day.shifts.pm !== null
              updateDay(day.dayOfWeek, {
                isWorking: value,
                shifts: value && !hasShifts ? defaultShifts(split) : day.shifts,
              })
            }}
            onShiftsChange={(shifts) => updateDay(day.dayOfWeek, { shifts })}
            timeError={timeErrors[day.dayOfWeek]}
          />
        ))}
      </div>

      {!readOnly && (
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 active:bg-teal-800 text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
        >
          {isSaving ? 'Guardando...' : 'Guardar horario'}
        </button>
      </div>
      )}
    </div>
  )
}
