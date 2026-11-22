import { useState } from 'react'
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
import { EditPopup } from '../appearance/SectionCard'

interface ExceptionDateFormProps {
  isSaving: boolean
  /** true when the business works in two shifts (matutino / vespertino). */
  split?: boolean
  /** Adds the day. Resolves to false when it could not be saved: the pop-up then stays open. */
  onAdd: (exception: StaffExceptionInput) => Promise<boolean | void> | void
  /** A problem saving, shown inside the pop-up. */
  error?: string | null
}

function defaultShifts(split: boolean): DayShifts {
  return split ? { am: DEFAULT_MORNING, pm: DEFAULT_AFTERNOON } : { am: DEFAULT_CONTINUOUS, pm: null }
}

const fieldCls =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)] disabled:opacity-50'

/** The "Agregar" button of the days off list; the form to add a day opens in a pop-up. */
export function ExceptionDateForm({ isSaving, split = false, onAdd, error }: ExceptionDateFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [exceptionDate, setExceptionDate] = useState('')
  const [exceptionType, setExceptionType] = useState<StaffExceptionType>('day_off')
  const [shifts, setShifts] = useState<DayShifts>(() => defaultShifts(split))
  const [reason, setReason] = useState('')
  const [dateError, setDateError] = useState<string | null>(null)
  const [timeError, setTimeError] = useState<string | null>(null)

  const reset = () => {
    setExceptionDate('')
    setExceptionType('day_off')
    setShifts(defaultShifts(split))
    setReason('')
    setDateError(null)
    setTimeError(null)
  }

  const open = () => {
    reset()
    setIsOpen(true)
  }

  const handleSubmit = async () => {
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

    const saved = await onAdd({
      exceptionDate,
      exceptionType,
      startsAt: exceptionType === 'custom_hours' ? (shifts.am?.start ?? null) : null,
      endsAt: exceptionType === 'custom_hours' ? (shifts.am?.end ?? null) : null,
      pmStartsAt: exceptionType === 'custom_hours' ? (shifts.pm?.start ?? null) : null,
      pmEndsAt: exceptionType === 'custom_hours' ? (shifts.pm?.end ?? null) : null,
      reason: reason.trim() || null,
    })

    // Only a save that failed keeps the pop-up (and what was typed) open
    if (saved !== false) {
      setIsOpen(false)
      reset()
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={open}
          className="rounded-lg bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
        >
          + Agregar
        </button>
      </div>

      {isOpen && (
        <EditPopup
          title="Agregar día libre o especial"
          onClose={() => setIsOpen(false)}
          onSubmit={handleSubmit}
          isSaving={isSaving}
          error={error}
          submitLabel="Agregar día"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="exception-date" className="mb-1 block text-sm font-medium text-gray-700">
                Fecha
              </label>
              <input
                id="exception-date"
                type="date"
                value={exceptionDate}
                onChange={(e) => setExceptionDate(e.target.value)}
                disabled={isSaving}
                aria-invalid={dateError ? true : undefined}
                className="dt-field"
              />
              {dateError && <p className="mt-1 text-xs text-red-600">{dateError}</p>}
            </div>

            <div>
              <label htmlFor="exception-type" className="mb-1 block text-sm font-medium text-gray-700">
                Tipo
              </label>
              <Select
                id="exception-type"
                value={exceptionType}
                onChange={(e) => setExceptionType(e.target.value as StaffExceptionType)}
                disabled={isSaving}
                className={fieldCls}
              >
                <option value="day_off">Día libre</option>
                <option value="custom_hours">Horario especial</option>
              </Select>
            </div>
          </div>

          {exceptionType === 'custom_hours' && (
            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700">Horario</span>
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

          <div>
            <label htmlFor="exception-reason" className="mb-1 block text-sm font-medium text-gray-700">
              Motivo <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              id="exception-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSaving}
              placeholder="Ej: Vacaciones, feriado, etc."
              className={fieldCls}
            />
          </div>
        </EditPopup>
      )}
    </>
  )
}
