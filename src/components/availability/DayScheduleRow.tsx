import { TimeRangeInput } from './TimeRangeInput'

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_LABELS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

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
  const id = `day-toggle-${dayOfWeek}`

  return (
    <div
      className={`px-4 py-3 transition-colors ${
        isWorking ? 'bg-teal-50/40' : 'bg-white'
      }`}
    >
      {/* Flex row: day label + toggle + time (desktop inline, mobile stacked) */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
        <span
          className={`text-sm font-semibold shrink-0 w-24 ${
            isWorking ? 'text-teal-800' : 'text-shell-subtleText'
          }`}
        >
          <span className="hidden sm:inline">{DAY_LABELS_FULL[dayOfWeek]}</span>
          <span className="sm:hidden">{DAY_LABELS[dayOfWeek]}</span>
        </span>

        {/* Toggle switch */}
        <label
          htmlFor={id}
          className="inline-flex items-center gap-2.5 cursor-pointer select-none shrink-0"
        >
          <span className="sr-only">{DAY_LABELS_FULL[dayOfWeek]} trabaja</span>
          <div className="relative">
            <input
              id={id}
              type="checkbox"
              checked={isWorking}
              onChange={(e) => onIsWorkingChange(e.target.checked)}
              disabled={disabled}
              className="sr-only peer"
            />
            <div
              className={`w-10 h-5 rounded-full transition-colors duration-200 peer-disabled:opacity-50 ${
                isWorking ? 'bg-teal-600' : 'bg-gray-200'
              }`}
            />
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 peer-disabled:opacity-50 ${
                isWorking ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
          <span
            className={`text-sm font-medium ${
              isWorking ? 'text-teal-700' : 'text-gray-400'
            }`}
          >
            {isWorking ? 'Trabaja' : 'No trabaja'}
          </span>
        </label>

        {/* Time range — wraps to next line on mobile when both toggle+label take full width */}
        {isWorking && (
          <div className="w-full sm:w-auto">
            <TimeRangeInput
              startsAt={startsAt}
              endsAt={endsAt}
              disabled={disabled}
              onStartsAtChange={onStartsAtChange}
              onEndsAtChange={onEndsAtChange}
              error={timeError}
            />
          </div>
        )}
      </div>
    </div>
  )
}
