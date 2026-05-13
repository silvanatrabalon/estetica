import { TimeRangeInput } from './TimeRangeInput'

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

interface DayScheduleRowProps {
  dayOfWeek: number
  isWorking: boolean
  startsAt: string
  endsAt: string
  disabled?: boolean
  onIsWorkingChange: (value: boolean) => void
  onStartsAtChange: (value: string) => void
  onEndsAtChange: (value: string) => void
  timeError?: string | null
}

export function DayScheduleRow({
  dayOfWeek,
  isWorking,
  startsAt,
  endsAt,
  disabled = false,
  onIsWorkingChange,
  onStartsAtChange,
  onEndsAtChange,
  timeError,
}: DayScheduleRowProps) {
  return (
    <div className="flex items-center gap-6 px-4 py-3">
      <span className="w-10 text-sm font-medium text-gray-700 shrink-0">
        {DAY_LABELS[dayOfWeek]}
      </span>

      <label className="flex items-center gap-2 cursor-pointer w-24 shrink-0">
        <input
          type="checkbox"
          checked={isWorking}
          onChange={(e) => onIsWorkingChange(e.target.checked)}
          disabled={disabled}
          aria-label={`${DAY_LABELS[dayOfWeek]} trabaja`}
          className="w-4 h-4 accent-blue-600 disabled:opacity-50"
        />
        <span className="text-sm text-gray-600">Trabaja</span>
      </label>

      {isWorking && (
        <TimeRangeInput
          startsAt={startsAt}
          endsAt={endsAt}
          disabled={disabled}
          onStartsAtChange={onStartsAtChange}
          onEndsAtChange={onEndsAtChange}
          error={timeError}
        />
      )}
    </div>
  )
}
