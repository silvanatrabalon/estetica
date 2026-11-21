import type { ChangeEvent } from 'react'

interface TimeRangeInputProps {
  startsAt: string
  endsAt: string
  disabled?: boolean
  onStartsAtChange: (value: string) => void
  onEndsAtChange: (value: string) => void
  error?: string | null
  /** Optional prefix for the accessible names, e.g. "Lunes: Turno matutino". */
  ariaPrefix?: string
}

export function TimeRangeInput({
  startsAt,
  endsAt,
  disabled = false,
  onStartsAtChange,
  onEndsAtChange,
  error,
  ariaPrefix,
}: TimeRangeInputProps) {
  const handleStartsAtChange = (e: ChangeEvent<HTMLInputElement>) => {
    onStartsAtChange(e.target.value)
  }

  const handleEndsAtChange = (e: ChangeEvent<HTMLInputElement>) => {
    onEndsAtChange(e.target.value)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-shell-subtleText font-medium">Desde</label>
          <input
            type="time"
            value={startsAt}
            onChange={handleStartsAtChange}
            disabled={disabled}
            aria-label={ariaPrefix ? `${ariaPrefix}: hora de inicio` : 'Hora de inicio'}
            className="border border-shell-border rounded-lg px-2.5 py-1.5 text-sm font-medium text-shell-text bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
          />
        </div>
        <span className="text-sm text-shell-subtleText">–</span>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-shell-subtleText font-medium">Hasta</label>
          <input
            type="time"
            value={endsAt}
            onChange={handleEndsAtChange}
            disabled={disabled}
            aria-label={ariaPrefix ? `${ariaPrefix}: hora de fin` : 'Hora de fin'}
            className="border border-shell-border rounded-lg px-2.5 py-1.5 text-sm font-medium text-shell-text bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}
