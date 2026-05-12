import { describe, expect, it } from 'vitest'
import {
  isLastActiveAdminDeactivation,
  isLastActiveAdminRoleDemotion,
  isSelfDemotion,
} from './adminUserPolicies'

describe('adminUserPolicies', () => {
  it('detects self-demotion attempts', () => {
    expect(
      isSelfDemotion({
        actorUserId: 'admin-1',
        targetUserId: 'admin-1',
        nextRole: 'staff',
      }),
    ).toBe(true)

    expect(
      isSelfDemotion({
        actorUserId: 'admin-1',
        targetUserId: 'admin-1',
        nextRole: 'admin',
      }),
    ).toBe(false)
  })

  it('detects last-active-admin demotion', () => {
    expect(
      isLastActiveAdminRoleDemotion({
        currentRole: 'admin',
        nextRole: 'customer',
        isActive: true,
        activeAdminCount: 1,
      }),
    ).toBe(true)

    expect(
      isLastActiveAdminRoleDemotion({
        currentRole: 'admin',
        nextRole: 'staff',
        isActive: true,
        activeAdminCount: 2,
      }),
    ).toBe(false)
  })

  it('detects last-active-admin deactivation', () => {
    expect(
      isLastActiveAdminDeactivation({
        role: 'admin',
        isActive: true,
        nextIsActive: false,
        activeAdminCount: 1,
      }),
    ).toBe(true)

    expect(
      isLastActiveAdminDeactivation({
        role: 'admin',
        isActive: true,
        nextIsActive: false,
        activeAdminCount: 3,
      }),
    ).toBe(false)
  })
})
