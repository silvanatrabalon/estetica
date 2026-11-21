/** A working window inside a day, as "HH:MM" strings. */
export interface ShiftWindow {
  start: string
  end: string
}

/** A day with up to two shifts: matutino (am) and vespertino (pm). */
export interface DayShifts {
  am: ShiftWindow | null
  pm: ShiftWindow | null
}

export const DEFAULT_MORNING: ShiftWindow = { start: '09:00', end: '13:00' }
export const DEFAULT_AFTERNOON: ShiftWindow = { start: '15:00', end: '19:00' }
export const DEFAULT_CONTINUOUS: ShiftWindow = { start: '09:00', end: '18:00' }

const hhmm = (t: string) => t.slice(0, 5)

/** Builds DayShifts from the nullable columns coming from the API. */
export function toDayShifts(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  pmStartsAt: string | null | undefined,
  pmEndsAt: string | null | undefined,
): DayShifts {
  return {
    am: startsAt && endsAt ? { start: hhmm(startsAt), end: hhmm(endsAt) } : null,
    pm: pmStartsAt && pmEndsAt ? { start: hhmm(pmStartsAt), end: hhmm(pmEndsAt) } : null,
  }
}

/** Returns a Spanish error message, or null when the shifts are valid. */
export function validateShifts(shifts: DayShifts): string | null {
  const { am, pm } = shifts

  if (!am && !pm) return 'Elegí al menos un turno.'

  for (const [label, w] of [['matutino', am], ['vespertino', pm]] as const) {
    if (!w) continue
    if (!w.start || !w.end) return `Ingresá la hora de inicio y fin del turno ${label}.`
    if (w.start >= w.end) return `En el turno ${label}, el inicio debe ser anterior al fin.`
  }

  if (am && pm && am.end > pm.start) {
    return 'El turno vespertino debe empezar después de que termine el matutino.'
  }

  return null
}

/**
 * Collapses to a single continuous window (first start to last end).
 * Mirrors what the server does when the business turns split shifts off.
 */
export function collapseShifts(shifts: DayShifts): DayShifts {
  const { am, pm } = shifts
  if (!am && !pm) return { am: null, pm: null }
  const start = [am?.start, pm?.start].filter(Boolean).sort()[0] as string
  const end = [am?.end, pm?.end].filter(Boolean).sort().at(-1) as string
  return { am: { start, end }, pm: null }
}

/** Short human text, e.g. "09:00–13:00 y 15:00–19:00". */
export function describeShifts(shifts: DayShifts): string {
  return [shifts.am, shifts.pm]
    .filter((w): w is ShiftWindow => w !== null)
    .map((w) => `${w.start}–${w.end}`)
    .join(' y ')
}
