import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNavigation } from '../hooks/useNavigation'
import { navigationByRole, getNavigationForRole } from '../../../lib/navigation'
import type { AppRole } from '../../../context/UserContext'

describe('useNavigation hook', () => {
  describe('navigation items by role', () => {
    it('should return customer routes for customer role', () => {
      const { result } = renderHook(() => useNavigation('customer'))

      expect(result.current).toBeDefined()
      expect(Array.isArray(result.current)).toBe(true)
      
      // Should include shared items
      const hasSharedItems = result.current.some(item =>
        navigationByRole.all.some(shared => shared.id === item.id)
      )
      expect(hasSharedItems).toBe(true)
      
      // Should include customer specific items
      const hasCustomerItems = result.current.some(item =>
        navigationByRole.customer.some(customer => customer.id === item.id)
      )
      expect(hasCustomerItems).toBe(true)
    })

    it('should return staff routes for staff role', () => {
      const { result } = renderHook(() => useNavigation('staff'))

      expect(result.current).toBeDefined()
      expect(Array.isArray(result.current)).toBe(true)
      
      // Should include shared items
      const hasSharedItems = result.current.some(item =>
        navigationByRole.all.some(shared => shared.id === item.id)
      )
      expect(hasSharedItems).toBe(true)
      
      // Should include staff specific items
      const hasStaffItems = result.current.some(item =>
        navigationByRole.staff.some(staff => staff.id === item.id)
      )
      expect(hasStaffItems).toBe(true)
    })

    it('should return admin routes for admin role', () => {
      const { result } = renderHook(() => useNavigation('admin'))

      expect(result.current).toBeDefined()
      expect(Array.isArray(result.current)).toBe(true)
      
      // Should include shared items
      const hasSharedItems = result.current.some(item =>
        navigationByRole.all.some(shared => shared.id === item.id)
      )
      expect(hasSharedItems).toBe(true)
      
      // Should include admin specific items
      const hasAdminItems = result.current.some(item =>
        navigationByRole.admin.some(admin => admin.id === item.id)
      )
      expect(hasAdminItems).toBe(true)
    })
  })

  describe('filtering by role', () => {
    it('should not include admin-only routes for customer', () => {
      const { result } = renderHook(() => useNavigation('customer'))

      const adminOnlyIds = ['users', 'services', 'reports']
      const hasAdminRoutes = result.current.some(item =>
        adminOnlyIds.includes(item.id)
      )

      expect(hasAdminRoutes).toBe(false)
    })

    it('should not include admin-only routes for staff', () => {
      const { result } = renderHook(() => useNavigation('staff'))

      const adminOnlyIds = ['users', 'services', 'reports']
      const hasAdminRoutes = result.current.some(item =>
        adminOnlyIds.includes(item.id)
      )

      expect(hasAdminRoutes).toBe(false)
    })

    it('should include admin-only routes for admin', () => {
      const { result } = renderHook(() => useNavigation('admin'))

      const adminOnlyIds = ['users', 'services', 'reports']
      const hasAllAdminRoutes = adminOnlyIds.every(id =>
        result.current.some(item => item.id === id)
      )

      expect(hasAllAdminRoutes).toBe(true)
    })

    it('should not include customer-only booking for staff or admin', () => {
      const staffResult = renderHook(() => useNavigation('staff')).result
      const adminResult = renderHook(() => useNavigation('admin')).result

      const hasBookingStaff = staffResult.current.some(item => item.id === 'booking')
      const hasBookingAdmin = adminResult.current.some(item => item.id === 'booking')

      expect(hasBookingStaff).toBe(false)
      expect(hasBookingAdmin).toBe(false)
    })
  })

  describe('empty and null cases', () => {
    it('should return empty array when role is null', () => {
      const { result } = renderHook(() => useNavigation(null))

      expect(result.current).toBeDefined()
      expect(Array.isArray(result.current)).toBe(true)
      expect(result.current.length).toBe(0)
    })

    it('should return empty array when role is undefined', () => {
      const { result } = renderHook(() => useNavigation(undefined as any))

      expect(result.current).toBeDefined()
      expect(Array.isArray(result.current)).toBe(true)
    })
  })

  describe('route structure validation', () => {
    it('should return items with proper NavItem structure for customer', () => {
      const { result } = renderHook(() => useNavigation('customer'))

      result.current.forEach(item => {
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('label')
        expect(item).toHaveProperty('href')
        expect(item).toHaveProperty('roles')
        expect(typeof item.id).toBe('string')
        expect(typeof item.label).toBe('string')
        expect(typeof item.href).toBe('string')
        expect(Array.isArray(item.roles)).toBe(true)
      })
    })

    it('should have valid hrefs for all items', () => {
      const { result } = renderHook(() => useNavigation('admin'))

      result.current.forEach(item => {
        expect(item.href).toMatch(/^\//)
      })
    })
  })

  describe('memoization and consistency', () => {
    it('should return consistent results for same role', () => {
      const { result: result1 } = renderHook(() => useNavigation('customer'))
      const { result: result2 } = renderHook(() => useNavigation('customer'))

      expect(result1.current.length).toBe(result2.current.length)
      expect(result1.current.map(i => i.id)).toEqual(
        result2.current.map(i => i.id)
      )
    })

    it('should return different results for different roles', () => {
      const { result: customerResult } = renderHook(() => useNavigation('customer'))
      const { result: adminResult } = renderHook(() => useNavigation('admin'))

      expect(customerResult.current.length).not.toBe(adminResult.current.length)
    })
  })
})
