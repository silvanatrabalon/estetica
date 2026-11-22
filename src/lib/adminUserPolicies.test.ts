import { describe, expect, it } from 'vitest'
import {
  isLastActiveAdminRoleDemotion,
  isSelfDemotion,
} from './adminUserPolicies'

describe('adminUserPolicies', () => {
  it('detects self-demotion attempts', () => {
    expect(
      isSelfDemotion({
        actorUserId: 'admin-1',
        targetUserId: 'admin-1',
        nextRoles: ['staff'],
      }),
    ).toBe(true)

    expect(
      isSelfDemotion({
        actorUserId: 'admin-1',
        targetUserId: 'admin-1',
        nextRoles: ['admin'],
      }),
    ).toBe(false)
  })

  it('detects last-active-admin demotion', () => {
    expect(
      isLastActiveAdminRoleDemotion({
        currentRoles: ['admin'],
        nextRoles: ['customer'],
        isActive: true,
        activeAdminCount: 1,
      }),
    ).toBe(true)

    expect(
      isLastActiveAdminRoleDemotion({
        currentRoles: ['admin'],
        nextRoles: ['staff'],
        isActive: true,
        activeAdminCount: 2,
      }),
    ).toBe(false)
  })
})
