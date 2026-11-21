import { useEffect, useState } from 'react'
import { getSplitShifts } from '../services/businessSettings'

/** Whether the business works in two shifts (matutino / vespertino). Defaults to false. */
export function useSplitShifts(): boolean {
  const [split, setSplit] = useState(false)

  useEffect(() => {
    let cancelled = false
    getSplitShifts()
      .then((value) => {
        if (!cancelled) setSplit(value)
      })
      .catch(() => {
        // keep the continuous default
      })
    return () => {
      cancelled = true
    }
  }, [])

  return split
}
