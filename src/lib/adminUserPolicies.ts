import type { AppRole } from '../context/UserContext'

export function isSelfDemotion(params: {
  actorUserId: string | null
  targetUserId: string
  nextRoles: AppRole[]
}): boolean {
  if (!params.actorUserId) {
    return false
  }

  return params.actorUserId === params.targetUserId && !params.nextRoles.includes('admin')
}

export function isLastActiveAdminRoleDemotion(params: {
  currentRoles: AppRole[]
  nextRoles: AppRole[]
  isActive: boolean
  activeAdminCount: number
}): boolean {
  return (
    params.currentRoles.includes('admin') &&
    !params.nextRoles.includes('admin') &&
    params.isActive &&
    params.activeAdminCount <= 1
  )
}

export function isLastActiveAdminDeactivation(params: {
  roles: AppRole[]
  isActive: boolean
  nextIsActive: boolean
  activeAdminCount: number
}): boolean {
  return (
    params.roles.includes('admin') &&
    params.isActive &&
    !params.nextIsActive &&
    params.activeAdminCount <= 1
  )
}
