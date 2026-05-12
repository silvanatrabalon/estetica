import type { AppRole } from '../context/UserContext'

export function isSelfDemotion(params: {
  actorUserId: string | null
  targetUserId: string
  nextRole: AppRole
}): boolean {
  if (!params.actorUserId) {
    return false
  }

  return params.actorUserId === params.targetUserId && params.nextRole !== 'admin'
}

export function isLastActiveAdminRoleDemotion(params: {
  currentRole: AppRole
  nextRole: AppRole
  isActive: boolean
  activeAdminCount: number
}): boolean {
  return (
    params.currentRole === 'admin' &&
    params.nextRole !== 'admin' &&
    params.isActive &&
    params.activeAdminCount <= 1
  )
}

export function isLastActiveAdminDeactivation(params: {
  role: AppRole
  isActive: boolean
  nextIsActive: boolean
  activeAdminCount: number
}): boolean {
  return (
    params.role === 'admin' &&
    params.isActive &&
    !params.nextIsActive &&
    params.activeAdminCount <= 1
  )
}
