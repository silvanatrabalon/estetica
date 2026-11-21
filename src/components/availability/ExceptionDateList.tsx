import type { StaffScheduleException } from '../../services/staffAvailability'
import { describeShifts, toDayShifts } from '../../lib/shifts'

const TYPE_LABELS: Record<string, string> = {
  day_off: 'Día libre',
  custom_hours: 'Horario especial',
}

const TYPE_COLORS: Record<string, string> = {
  day_off: 'bg-orange-100 text-orange-700',
  custom_hours: 'bg-teal-100 text-teal-700',
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface ExceptionDateListProps {
  exceptions: StaffScheduleException[]
  isSaving: boolean
  onRemove: (exceptionDate: string) => void
  /** View only: hides the delete buttons. */
  readOnly?: boolean
}

export function ExceptionDateList({ exceptions, isSaving, onRemove, readOnly = false }: ExceptionDateListProps) {
  if (exceptions.length === 0) {
    return (
      <p className="text-sm text-shell-subtleText py-3 text-center italic">
        Sin días libres ni especiales registrados.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {exceptions.map((exc) => (
        <li
          key={exc.id}
          className="flex items-start sm:items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-shell-border"
        >
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-semibold text-shell-text">{formatDate(exc.exceptionDate)}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  TYPE_COLORS[exc.exceptionType] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {TYPE_LABELS[exc.exceptionType] ?? exc.exceptionType}
              </span>
              {exc.exceptionType === 'custom_hours' && (
                <span className="text-xs text-shell-subtleText font-mono">
                  {describeShifts(toDayShifts(exc.startsAt, exc.endsAt, exc.pmStartsAt, exc.pmEndsAt))}
                </span>
              )}
              {exc.reason && (
                <span className="text-xs text-shell-subtleText truncate max-w-[160px]">· {exc.reason}</span>
              )}
            </div>
          </div>
          {!readOnly && (
          <button
            type="button"
            onClick={() => onRemove(exc.exceptionDate)}
            disabled={isSaving}
            className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            Eliminar
          </button>
          )}
        </li>
      ))}
    </ul>
  )
}
