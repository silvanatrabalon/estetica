import type { StaffScheduleException } from '../../services/staffAvailability'

const TYPE_LABELS: Record<string, string> = {
  day_off: 'Día libre',
  custom_hours: 'Horario especial',
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
}

export function ExceptionDateList({ exceptions, isSaving, onRemove }: ExceptionDateListProps) {
  if (exceptions.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-2">
        No hay excepciones registradas para este profesional.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-gray-100 border border-gray-200 rounded-md">
      {exceptions.map((exc) => (
        <li key={exc.id} className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-800">{formatDate(exc.exceptionDate)}</span>
            <span className="text-xs text-gray-500">
              {TYPE_LABELS[exc.exceptionType] ?? exc.exceptionType}
              {exc.exceptionType === 'custom_hours' && exc.startsAt && exc.endsAt
                ? ` · ${exc.startsAt.slice(0, 5)} – ${exc.endsAt.slice(0, 5)}`
                : ''}
              {exc.reason ? ` · ${exc.reason}` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(exc.exceptionDate)}
            disabled={isSaving}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            Eliminar
          </button>
        </li>
      ))}
    </ul>
  )
}
