import { useContext } from 'react'
import { ShellContext } from '../context'

export function useShellContext() {
  const context = useContext(ShellContext)
  if (context === undefined) {
    throw new Error('useShellContext must be used within ShellProvider')
  }
  return context
}
