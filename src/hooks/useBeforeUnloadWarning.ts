import { useEffect } from 'react'

/** While `active`, closing or reloading the page makes the browser ask before losing the changes. */
export function useBeforeUnloadWarning(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [active])
}
