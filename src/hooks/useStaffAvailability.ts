import { useCallback, useEffect, useState } from 'react'
import {
  addStaffException,
  getStaffWeeklySchedule,
  listStaffExceptions,
  removeStaffException,
  setStaffWeeklySchedule,
  type StaffExceptionInput,
  type StaffScheduleDay,
  type StaffScheduleDayInput,
  type StaffScheduleException,
} from '../services/staffAvailability'

export interface UseStaffAvailabilityResult {
  schedule: StaffScheduleDay[]
  exceptions: StaffScheduleException[]
  isLoading: boolean
  isSaving: boolean
  isDirty: boolean
  errorMessage: string | null
  successMessage: string | null
  saveSchedule: (days: StaffScheduleDayInput[]) => Promise<void>
  addException: (exception: StaffExceptionInput) => Promise<void>
  removeException: (exceptionDate: string) => Promise<void>
  setIsDirty: (dirty: boolean) => void
}

export function useStaffAvailability(staffId: string): UseStaffAvailabilityResult {
  const [schedule, setSchedule] = useState<StaffScheduleDay[]>([])
  const [exceptions, setExceptions] = useState<StaffScheduleException[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [scheduleData, exceptionsData] = await Promise.all([
        getStaffWeeklySchedule(staffId),
        listStaffExceptions(staffId),
      ])
      setSchedule(scheduleData)
      setExceptions(exceptionsData)
    } catch {
      setErrorMessage('No pudimos cargar la disponibilidad. Intentá de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }, [staffId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const saveSchedule = useCallback(
    async (days: StaffScheduleDayInput[]) => {
      setIsSaving(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      try {
        const saved = await setStaffWeeklySchedule(staffId, days)
        setSchedule(saved)
        setIsDirty(false)
        setSuccessMessage('Horario guardado correctamente.')
      } catch {
        setErrorMessage('No pudimos guardar el horario. Intenta de nuevo.')
      } finally {
        setIsSaving(false)
      }
    },
    [staffId],
  )

  const addException = useCallback(
    async (exception: StaffExceptionInput) => {
      setIsSaving(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      try {
        const upserted = await addStaffException(staffId, exception)
        setExceptions((current) => {
          const idx = current.findIndex((e) => e.exceptionDate === upserted.exceptionDate)
          if (idx >= 0) {
            const updated = [...current]
            updated[idx] = upserted
            return updated.sort((a, b) => a.exceptionDate.localeCompare(b.exceptionDate))
          }
          return [...current, upserted].sort((a, b) =>
            a.exceptionDate.localeCompare(b.exceptionDate),
          )
        })
        setSuccessMessage('Excepción guardada correctamente.')
      } catch (err) {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('duplicate') || msg.includes('unique')) {
          setErrorMessage('La fecha seleccionada ya tiene una excepción registrada.')
        } else {
          setErrorMessage('No pudimos guardar la excepción. Intentá de nuevo.')
        }
      } finally {
        setIsSaving(false)
      }
    },
    [staffId],
  )

  const removeException = useCallback(
    async (exceptionDate: string) => {
      setIsSaving(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      try {
        await removeStaffException(staffId, exceptionDate)
        setExceptions((current) => current.filter((e) => e.exceptionDate !== exceptionDate))
        setSuccessMessage('Excepción eliminada correctamente.')
      } catch {
        setErrorMessage('No pudimos eliminar la excepción. Intentá de nuevo.')
      } finally {
        setIsSaving(false)
      }
    },
    [staffId],
  )

  return {
    schedule,
    exceptions,
    isLoading,
    isSaving,
    isDirty,
    errorMessage,
    successMessage,
    saveSchedule,
    addException,
    removeException,
    setIsDirty,
  }
}
