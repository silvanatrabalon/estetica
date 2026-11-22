import { FormEvent, useState } from 'react'
import type { StaffExceptionInput, StaffExceptionType } from '../../services/staffAvailability'
import {
  DEFAULT_AFTERNOON,
  DEFAULT_CONTINUOUS,
  DEFAULT_MORNING,
  validateShifts,
  type DayShifts,
} from '../../lib/shifts'
import { ShiftsFields } from './ShiftsFields'
import { Select } from '../Select'

interface ExceptionDateFormProps {
  isSaving: boolean
  /** true when the business works in two shifts (matutino / vespertino). */
  split?: boolean
  onAdd: (exception: StaffExceptionInput) => void
}

function defaultShifts(split: boolean): DayShifts {
  return split ? { am: DEFAULT_MORNING, pm: DEFAULT_AFTERNOON } : { am: DEFAULT_CONTINUOUS, pm: null }
}

export function ExceptionDateForm({ isSaving, split = false, onAdd }: ExceptionDateFormProps) {
  const [exceptionDate, setExceptionDate] = useState('')
  const [exceptionType, setExceptionType] = useState<StaffExceptionType>('day_off')
  const [shifts, setShifts] = useState<DayShifts>(() => defaultShifts(split))
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
      const shiftsError = validateShifts(shifts)
      if (shiftsError) {
        setTimeError(shiftsError)
        return
      }
    }

    onAdd({
      exceptionDate,
      exceptionType,
      startsAt: exceptionType === 'custom_hours' ? (shifts.am?.start ?? null) : null,
      endsAt: exceptionType === 'custom_hours' ? (shifts.am?.end ?? null) : null,
      pmStartsAt: exceptionType === 'custom_hours' ? (shifts.pm?.start ?? null) : null,
      pmEndsAt: exceptionType === 'custom_hours' ? (shifts.pm?.end ?? null) : null,
      reason: reason.trim() || null,
    })

    setExceptionDate('')
    setExceptionType('day_off')
    setShifts(defaultShifts(split))
    setReason('')
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-2xl border border-shell-border bg-shell-muted/30 p-4"
      noValidate
    >
      <h3 className="text-sm font-semibold text-shell-text mb-4 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">+</span>
        Agregar día libre o especial
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="exception-date" className="block text-xs font-semibold text-shell-subtleText mb-1.5 uppercase tracking-wide">
            Fecha
          </label>
          <input
            id="exception-date"
            type="date"
            value={exceptionDate}
            onChange={(e) => setExceptionDate(e.target.value)}
            disabled={isSaving}
            className="dt-field"
          />
          {dateError && <p className="mt-1.5 text-xs text-red-500">{dateError}</p>}
        </div>

        <div>
          <label htmlFor="exception-type" className="block text-xs font-semibold text-shell-subtleText mb-1.5 uppercase tracking-wide">
            Tipo
          </label>
          <Select
            id="exception-type"
            value={exceptionType}
            onChange={(e) => setExceptionType(e.target.value as StaffExceptionType)}
            disabled={isSaving}
            className="w-full border border-shell-border rounded-xl px-3 py-2 text-sm text-shell-text bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
          >
            <option value="day_off">Día libre</option>
            <option value="custom_hours">Horario especial</option>
          </Select>
        </div>

        {exceptionType === 'custom_hours' && (
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-shell-subtleText mb-1.5 uppercase tracking-wide">Horario</label>
            <ShiftsFields
              split={split}
              value={shifts}
              onChange={(next) => {
                setShifts(next)
                setTimeError(null)
              }}
              disabled={isSaving}
              error={timeError}
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor="exception-reason" className="block text-xs font-semibold text-shell-subtleText mb-1.5 uppercase tracking-wide">
            Motivo <span className="normal-case font-normal">(opcional)</span>
          </label>
          <input
            id="exception-reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSaving}
            placeholder="Ej: Vacaciones, feriado, etc."
            className="w-full border border-shell-border rounded-xl px-3 py-2 text-sm text-shell-text bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
          />
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 active:bg-teal-800 text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSaving ? 'Guardando...' : '+ Agregar día'}
          </button>
        </div>
      </div>
    </form>
  )
}
