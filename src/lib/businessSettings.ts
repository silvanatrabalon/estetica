export type BusinessClosureType = 'full_day' | 'half_day'

export interface BusinessHoursInput {
  dayOfWeek: number
  isClosed: boolean
  opensAt: string | null
  closesAt: string | null
}

export interface BusinessClosureInput {
  closureDate: string
  closureType: BusinessClosureType
  startsAt: string | null
  endsAt: string | null
  reason: string | null
}

export interface BusinessReadinessInput {
  name: string
  timezone: string
  weeklyHours: BusinessHoursInput[]
}

export function normalizeBusinessName(name: string): string {
  return name.trim()
}

export function normalizeBusinessColor(color: string): string | null {
  const normalized = color.trim()
  return normalized.length > 0 ? normalized : null
}

export function normalizeBusinessText(value: string): string | null {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export function isValidIanaTimezone(timezone: string): boolean {
  const normalized = timezone.trim()

  if (normalized.length === 0) {
    return false
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: normalized }).format(new Date())
    return true
  } catch {
    return false
  }
}

function isValidHexColor(color: string): boolean {
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)
}

function compareTimes(left: string, right: string): number {
  return left.localeCompare(right)
}

export function validateBusinessIdentity(input: {
  name: string
  timezone: string
  primaryColor?: string | null
}): {
  valid: boolean
  errors: { name?: string; timezone?: string; primaryColor?: string }
} {
  const errors: { name?: string; timezone?: string; primaryColor?: string } = {}

  if (normalizeBusinessName(input.name).length < 2) {
    errors.name = 'El nombre del negocio debe tener al menos 2 caracteres.'
  }

  if (!isValidIanaTimezone(input.timezone)) {
    errors.timezone = 'Seleccioná una zona horaria IANA válida.'
  }

  if (input.primaryColor && !isValidHexColor(input.primaryColor)) {
    errors.primaryColor = 'Usá un color hexadecimal válido.'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateBusinessHours(input: BusinessHoursInput): {
  valid: boolean
  errors: { dayOfWeek?: string; opensAt?: string; closesAt?: string }
} {
  const errors: { dayOfWeek?: string; opensAt?: string; closesAt?: string } = {}

  if (input.dayOfWeek < 0 || input.dayOfWeek > 6) {
    errors.dayOfWeek = 'El día de la semana es inválido.'
  }

  if (input.isClosed) {
    if (input.opensAt || input.closesAt) {
      errors.opensAt = 'Un día cerrado no debe tener horario de apertura.'
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    }
  }

  if (!input.opensAt) {
    errors.opensAt = 'Indicá un horario de apertura.'
  }

  if (!input.closesAt) {
    errors.closesAt = 'Indicá un horario de cierre.'
  }

  if (input.opensAt && input.closesAt && compareTimes(input.opensAt, input.closesAt) >= 0) {
    errors.closesAt = 'El horario de cierre debe ser posterior al de apertura.'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateBusinessClosure(input: BusinessClosureInput): {
  valid: boolean
  errors: { closureDate?: string; startsAt?: string; endsAt?: string }
} {
  const errors: { closureDate?: string; startsAt?: string; endsAt?: string } = {}

  if (input.closureDate.trim().length === 0) {
    errors.closureDate = 'Indicá una fecha de cierre.'
  }

  if (input.closureType === 'full_day') {
    if (input.startsAt || input.endsAt) {
      errors.startsAt = 'Un cierre de día completo no debe tener franja horaria.'
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    }
  }

  if (!input.startsAt) {
    errors.startsAt = 'Indicá el inicio del cierre parcial.'
  }

  if (!input.endsAt) {
    errors.endsAt = 'Indicá el fin del cierre parcial.'
  }

  if (input.startsAt && input.endsAt && compareTimes(input.startsAt, input.endsAt) >= 0) {
    errors.endsAt = 'El fin del cierre parcial debe ser posterior al inicio.'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function computeBusinessReadiness(input: BusinessReadinessInput): {
  isReady: boolean
  missing: string[]
} {
  const missing: string[] = []

  if (normalizeBusinessName(input.name).length < 2) {
    missing.push('name')
  }

  if (!isValidIanaTimezone(input.timezone)) {
    missing.push('timezone')
  }

  const hasOpenDay = input.weeklyHours.some((hour) => {
    if (hour.isClosed) {
      return false
    }

    return validateBusinessHours(hour).valid
  })

  if (!hasOpenDay) {
    missing.push('weeklyHours')
  }

  return {
    isReady: missing.length === 0,
    missing,
  }
}