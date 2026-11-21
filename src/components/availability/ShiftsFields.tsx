import {
  DEFAULT_AFTERNOON,
  DEFAULT_CONTINUOUS,
  DEFAULT_MORNING,
  type DayShifts,
  type ShiftWindow,
} from '../../lib/shifts'
import { TimeRangeInput } from './TimeRangeInput'

interface ShiftsFieldsProps {
  /** true: matutino + vespertino. false: one continuous window. */
  split: boolean
  value: DayShifts
  onChange: (next: DayShifts) => void
  disabled?: boolean
  error?: string | null
  /** Used to build unique accessible names, e.g. "Lunes". */
  label?: string
}

interface ShiftRowProps {
  name: string
  window: ShiftWindow | null
  defaultWindow: ShiftWindow
  disabled: boolean
  label?: string
  onChange: (next: ShiftWindow | null) => void
}

function ShiftRow({ name, window, defaultWindow, disabled, label, onChange }: ShiftRowProps) {
  const prefix = label ? `${label}: ` : ''
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <label className="inline-flex w-36 shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-shell-text">
        <input
          type="checkbox"
          checked={window !== null}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked ? defaultWindow : null)}
          aria-label={`${prefix}${name}`}
          className="h-4 w-4 rounded border-shell-border accent-[var(--color-primary)]"
        />
        {name}
      </label>
      {window && (
        <TimeRangeInput
          startsAt={window.start}
          endsAt={window.end}
          disabled={disabled}
          onStartsAtChange={(start) => onChange({ ...window, start })}
          onEndsAtChange={(end) => onChange({ ...window, end })}
          ariaPrefix={`${prefix}${name}`}
        />
      )}
    </div>
  )
}

/**
 * Time inputs for one day: a single range when the business works continuously,
 * or "Turno matutino" / "Turno vespertino" (each optional) when it works in two shifts.
 */
export function ShiftsFields({ split, value, onChange, disabled = false, error, label }: ShiftsFieldsProps) {
  if (!split) {
    // Continuous day: always one range. Fall back to the afternoon window if that is all there is.
    const single = value.am ?? value.pm ?? DEFAULT_CONTINUOUS
    return (
      <div>
        <TimeRangeInput
          startsAt={single.start}
          endsAt={single.end}
          disabled={disabled}
          onStartsAtChange={(start) => onChange({ am: { ...single, start }, pm: null })}
          onEndsAtChange={(end) => onChange({ am: { ...single, end }, pm: null })}
          ariaPrefix={label}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <ShiftRow
        name="Turno matutino"
        window={value.am}
        defaultWindow={DEFAULT_MORNING}
        disabled={disabled}
        label={label}
        onChange={(am) => onChange({ ...value, am })}
      />
      <ShiftRow
        name="Turno vespertino"
        window={value.pm}
        defaultWindow={DEFAULT_AFTERNOON}
        disabled={disabled}
        label={label}
        onChange={(pm) => onChange({ ...value, pm })}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
