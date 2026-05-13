import { FormEvent, useState } from 'react'
import type { StaffExceptionInput, StaffExceptionType } from '../../services/staffAvailability'
import { TimeRangeInput } from './TimeRangeInput'

interface ExceptionDateFormProps {
  isSaving: boolean
  onAdd: (exception: StaffExceptionInput) => void
}

export function ExceptionDateForm({ isSaving, onAdd }: ExceptionDateFormProps) {
  const [exceptionDate, setExceptionDate] = useState('')
  const [exceptionType, setExceptionType] = useState<StaffExceptionType>('day_off')
  const [startsAt, setStartsAt] = useState('09:00')
  const [endsAt, setEndsAt] = useState('18:00')
  const [reason, setReason] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)
  const [timeError, setTimeError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setDateError(null)
    setTimeError(null)

    if (!exceptionDate) {
      setDateError('Seleccioná una fecha.')
      return
    }

    if (exceptionType === 'custom_hours') {
      if (!startsAt || !endsAt) {
        setTimeError('Ingresá la hora de inicio y fin.')
        return
      }
      if (startsAt >= endsAt) {
        setTimeError('La hora de inicio debe ser anterior a la hora de fin.')
        return
      }
    }

    onAdd({
      exceptionDate,
      exceptionType,
      startsAt: exceptionType === 'custom_hours' ? startsAt : null,
      endsAt: exceptionType === 'custom_hours' ? endsAt : null,
      reason: reason.trim() || null,
    })

    setExceptionDate('')
    setExceptionType('day_off')
    setStartsAt('09:00')
    setEndsAt('18:00')
    setReason('')
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="p-4 border border-gray-200 rounded-md bg-gray-50"
      noValidate
    >
      <h3 className="text-sm font-medium text-gray-800 mb-3">Agregar excepción</h3>

      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="exception-date" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha
          </label>
          <input
            id="exception-date"
            type="date"
            value={exceptionDate}
            onChange={(e) => setExceptionDate(e.target.value)}
            disabled={isSaving}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          {dateError && <p className="mt-1 text-xs text-red-600">{dateError}</p>}
        </div>

        <div>
          <label htmlFor="exception-type" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            id="exception-type"
            value={exceptionType}
            onChange={(e) => setExceptionType(e.target.value as StaffExceptionType)}
            disabled={isSaving}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="day_off">Día libre</option>
            <option value="custom_hours">Horario especial</option>
          </select>
        </div>

        {exceptionType === 'custom_hours' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
            <TimeRangeInput
              startsAt={startsAt}
              endsAt={endsAt}
              disabled={isSaving}
              onStartsAtChange={setStartsAt}
              onEndsAtChange={setEndsAt}
              error={timeError}
            />
          </div>
        )}

        <div>
          <label htmlFor="exception-reason" className="block text-sm font-medium text-gray-700 mb-1">
            Motivo (opcional)
          </label>
          <input
            id="exception-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSaving}
            placeholder="Ej: Vacaciones, feriado, etc."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : '+ Agregar excepción'}
          </button>
        </div>
      </div>
    </form>
  )
}
