import { useMemo, useState } from 'react'
import { cn } from '../../lib/cn'
import {
  addMonths,
  clampMonthRange,
  compareMonths,
  monthGrid,
  monthOfKey,
  monthTitle,
  slotLevel,
  type MonthRef,
} from '../../lib/bookingCalendar'
import { useAvailableDays } from '../../hooks/useAvailableDays'

interface BookingCalendarProps {
  serviceId: string
  /** First bookable day, YYYY-MM-DD (today in the business time zone). */
  minDate: string
  /** Last bookable day, YYYY-MM-DD. */
  maxDate: string
  selectedDate: string | null
  onSelect: (date: string) => void
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const LEVEL_STYLES = {
  many: 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
  few: 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100',
} as const

function dayLabel(key: string, count: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const text = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  )
  return `${text}, ${count} ${count === 1 ? 'horario libre' : 'horarios libres'}`
}

/** Month calendar where only the days with free slots can be picked, with a hint of how busy each is. */
export function BookingCalendar({ serviceId, minDate, maxDate, selectedDate, onSelect }: BookingCalendarProps) {
  const minMonth = monthOfKey(minDate)
  const maxMonth = monthOfKey(maxDate)
  const [view, setView] = useState<MonthRef>(() => (selectedDate ? monthOfKey(selectedDate) : minMonth))

  const range = useMemo(() => clampMonthRange(view, minDate, maxDate), [view, minDate, maxDate])
  const { days, loading, error } = useAvailableDays(serviceId, range?.from ?? null, range?.to ?? null)

  const weeks = monthGrid(view)
  const canGoPrev = compareMonths(view, minMonth) > 0
  const canGoNext = compareMonths(view, maxMonth) < 0
  const hasAnyDay = days.size > 0

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          disabled={!canGoPrev}
          onClick={() => setView((v) => addMonths(v, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-shell-border bg-white text-shell-text disabled:opacity-30"
        >
          ‹
        </button>
        <h3 aria-live="polite" className="text-base font-semibold text-shell-text">
          {monthTitle(view)}
        </h3>
        <button
          type="button"
          aria-label="Mes siguiente"
          disabled={!canGoNext}
          onClick={() => setView((v) => addMonths(v, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-shell-border bg-white text-shell-text disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center" role="grid" aria-label={monthTitle(view)} aria-busy={loading}>
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="py-1 text-xs font-semibold text-shell-subtleText" aria-hidden="true">
            {w}
          </div>
        ))}
        {weeks.flat().map((key, i) => {
          if (!key) return <div key={`blank-${i}`} />
          const count = days.get(key)
          const level = slotLevel(count)
          const dayNumber = Number(key.slice(8))
          const isSelected = key === selectedDate

          if (level === 'none') {
            return (
              <div
                key={key}
                aria-disabled="true"
                className="flex aspect-square items-center justify-center rounded-xl text-sm text-gray-300"
              >
                {dayNumber}
              </div>
            )
          }

          return (
            <button
              key={key}
              type="button"
              aria-label={dayLabel(key, count as number)}
              aria-pressed={isSelected}
              onClick={() => onSelect(key)}
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]',
                LEVEL_STYLES[level as 'many' | 'few'],
                isSelected && 'border-brand-primary bg-brand-primary text-white hover:bg-brand-primary',
              )}
            >
              {dayNumber}
            </button>
          )
        })}
      </div>

      {loading && <p className="mt-3 text-center text-sm text-shell-subtleText">Buscando días disponibles…</p>}
      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-red-600">
          {error}
        </p>
      )}
      {!loading && !error && !hasAnyDay && (
        <p className="mt-3 text-center text-sm text-shell-subtleText">
          No hay días disponibles este mes.{canGoNext ? ' Probá con el mes siguiente.' : ''}
        </p>
      )}

      <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-shell-subtleText">
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-emerald-300 bg-emerald-50" aria-hidden="true" />
          Varios horarios libres
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-amber-300 bg-amber-50" aria-hidden="true" />
          Pocos horarios libres
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-gray-100" aria-hidden="true" />
          Sin disponibilidad
        </li>
      </ul>
    </div>
  )
}
