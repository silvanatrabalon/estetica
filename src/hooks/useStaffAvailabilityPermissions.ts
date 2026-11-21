import { useCallback, useEffect, useState } from 'react'
import {
  adminSetStaffAvailabilityPermission,
  adminSetStaffDaysOffPermission,
  listStaffAvailabilityPermissions,
  type StaffAvailabilityPermissions,
} from '../services/adminStaff'

export interface UseStaffAvailabilityPermissionsResult {
  /** null while loading or when the lookup failed (the switches are then hidden). */
  permissions: StaffAvailabilityPermissions | null
  errorMessage: string | null
  setCanEditSchedule: (allowed: boolean) => Promise<void>
  setCanEditDaysOff: (allowed: boolean) => Promise<void>
}

/** Admin: what one professional may edit on their own availability. */
export function useStaffAvailabilityPermissions(staffId: string): UseStaffAvailabilityPermissionsResult {
  const [permissions, setPermissions] = useState<StaffAvailabilityPermissions | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!staffId) return
    let cancelled = false
    listStaffAvailabilityPermissions()
      .then((all) => {
        if (!cancelled) setPermissions(all[staffId] ?? null)
      })
      .catch(() => {
        if (!cancelled) setPermissions(null)
      })
    return () => {
      cancelled = true
    }
  }, [staffId])

  const change = useCallback(
    async (key: keyof StaffAvailabilityPermissions, allowed: boolean, save: () => Promise<void>) => {
      setErrorMessage(null)
      let previous: boolean | undefined
      setPermissions((current) => {
        if (!current) return current
        previous = current[key]
        return { ...current, [key]: allowed }
      })

      try {
        await save()
      } catch {
        setPermissions((current) => (current && previous !== undefined ? { ...current, [key]: previous } : current))
        setErrorMessage('No pudimos cambiar el permiso. Intentá de nuevo.')
      }
    },
    [],
  )

  const setCanEditSchedule = useCallback(
    (allowed: boolean) => change('canEditSchedule', allowed, () => adminSetStaffAvailabilityPermission(staffId, allowed)),
    [change, staffId],
  )

  const setCanEditDaysOff = useCallback(
    (allowed: boolean) => change('canEditDaysOff', allowed, () => adminSetStaffDaysOffPermission(staffId, allowed)),
    [change, staffId],
  )

  return { permissions, errorMessage, setCanEditSchedule, setCanEditDaysOff }
}
