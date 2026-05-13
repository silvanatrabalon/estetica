import type { ChangeEvent } from 'react'

interface TimeRangeInputProps {
  startsAt: string
  endsAt: string
  disabled?: boolean
  onStartsAtChange: (value: string) => void
  onEndsAtChange: (value: string) => void
  error?: string | null
}

export function TimeRangeInput({
  startsAt,
  endsAt,
  disabled = false,
  onStartsAtChange,
  onEndsAtChange,
  error,
}: TimeRangeInputProps) {
  const handleStartsAtChange = (e: ChangeEvent<HTMLInputElement>) => {
    onStartsAtChange(e.target.value)
  }

  const handleEndsAtChange = (e: ChangeEvent<HTMLInputElement>) => {
    onEndsAtChange(e.target.value)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={startsAt}
          onChange={handleStartsAtChange}
          disabled={disabled}
          aria-label="Hora de inicio"
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <span className="text-sm text-gray-500">–</span>
        <input
          type="time"
          value={endsAt}
          onChange={handleEndsAtChange}
          disabled={disabled}
          aria-label="Hora de fin"
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
