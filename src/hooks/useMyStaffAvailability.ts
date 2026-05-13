import { useCallback, useEffect, useState } from 'react'
import {
  getMyStaffMemberId,
  getStaffWeeklySchedule,
  listStaffExceptions,
  setMyWeeklySchedule,
  addMyException,
  removeMyException,
  type StaffExceptionInput,
  type StaffScheduleDay,
  type StaffScheduleDayInput,
  type StaffScheduleException,
} from '../services/staffAvailability'

export type MyStaffAvailabilityStatus = 'loading' | 'not-staff' | 'ready' | 'error'

export interface UseMyStaffAvailabilityResult {
  status: MyStaffAvailabilityStatus
  schedule: StaffScheduleDay[]
  exceptions: StaffScheduleException[]
  isSaving: boolean
  isDirty: boolean
  errorMessage: string | null
  successMessage: string | null
  saveSchedule: (days: StaffScheduleDayInput[]) => Promise<void>
  addException: (exception: StaffExceptionInput) => Promise<void>
  removeException: (exceptionDate: string) => Promise<void>
  setIsDirty: (dirty: boolean) => void
}

export function useMyStaffAvailability(): UseMyStaffAvailabilityResult {
  const [status, setStatus] = useState<MyStaffAvailabilityStatus>('loading')
  const [staffId, setStaffId] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<StaffScheduleDay[]>([])
  const [exceptions, setExceptions] = useState<StaffScheduleException[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setStatus('loading')
      setErrorMessage(null)

      try {
        const myStaffId = await getMyStaffMemberId()

        if (!myStaffId) {
          setStatus('not-staff')
          return
        }

        setStaffId(myStaffId)
        const [scheduleData, exceptionsData] = await Promise.all([
          getStaffWeeklySchedule(myStaffId),
          listStaffExceptions(myStaffId),
        ])
        setSchedule(scheduleData)
        setExceptions(exceptionsData)
        setStatus('ready')
      } catch {
        setErrorMessage('No pudimos cargar tu disponibilidad. Intentá de nuevo.')
        setStatus('error')
      }
    }

    void load()
  }, [])

  const saveSchedule = useCallback(
    async (days: StaffScheduleDayInput[]) => {
      setIsSaving(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      try {
        const saved = await setMyWeeklySchedule(days)
        setSchedule(saved)
        setIsDirty(false)
        setSuccessMessage('Horario guardado correctamente.')
      } catch {
        setErrorMessage('No pudimos guardar el horario. Intentá de nuevo.')
      } finally {
        setIsSaving(false)
      }
    },
    [],
  )

  const addException = useCallback(
    async (exception: StaffExceptionInput) => {
      setIsSaving(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      try {
        const upserted = await addMyException(exception)
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
        if (msg.includes('past')) {
          setErrorMessage('No podés agregar excepciones para fechas pasadas.')
        } else {
          setErrorMessage('No pudimos guardar la excepción. Intentá de nuevo.')
        }
      } finally {
        setIsSaving(false)
      }
    },
    [],
  )

  const removeException = useCallback(async (exceptionDate: string) => {
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await removeMyException(exceptionDate)
      setExceptions((current) => current.filter((e) => e.exceptionDate !== exceptionDate))
      setSuccessMessage('Excepción eliminada.')
    } catch {
      setErrorMessage('No pudimos eliminar la excepción. Intentá de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }, [])

  // staffId is used internally — expose it only if needed externally
  void staffId

  return {
    status,
    schedule,
    exceptions,
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
