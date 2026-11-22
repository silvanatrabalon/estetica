import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ADMIN_TABS, CUSTOMER_TABS, MobileTabBar, STAFF_TABS, type MobileTab } from './MobileTabBar'
import { TestShellProvider } from '../../../hooks/__test-utils__/test-providers'

function renderBar(
  path = '/admin/dashboard',
  props: { onToggleMobileMenu?: () => void; isMobileMenuOpen?: boolean } = {},
  tabs: MobileTab[] = ADMIN_TABS,
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TestShellProvider {...props}>
        <MobileTabBar tabs={tabs} />
      </TestShellProvider>
    </MemoryRouter>,
  )
}

describe('MobileTabBar', () => {
  it('offers the daily shortcuts and the full menu, without Calendario', () => {
    renderBar()
    expect(screen.getByRole('navigation', { name: 'Accesos rápidos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Inicio/ })).toHaveAttribute('href', '/admin/dashboard')
    expect(screen.getByRole('link', { name: /Turnos/ })).toHaveAttribute('href', '/admin/appointments')
    expect(screen.queryByRole('link', { name: /Calendario/ })).toBeNull()
    expect(screen.getByRole('button', { name: /Más/ })).toBeInTheDocument()
  })

  it('marks the current section', () => {
    renderBar('/admin/appointments')
    expect(screen.getByRole('link', { name: /Turnos/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Inicio/ })).not.toHaveAttribute('aria-current')
  })

  it('keeps a section marked on its sub-pages (edge case)', () => {
    renderBar('/admin/appointments/123')
    expect(screen.getByRole('link', { name: /Turnos/ })).toHaveAttribute('aria-current', 'page')
  })

  it('marks nothing on pages outside the shortcuts (edge case)', () => {
    renderBar('/admin/services')
    expect(screen.queryByRole('link', { current: 'page' })).toBeNull()
  })

  it('"Más" opens the full menu and reflects its state', () => {
    const onToggle = vi.fn()
    renderBar('/admin/dashboard', { onToggleMobileMenu: onToggle, isMobileMenuOpen: true })
    const more = screen.getByRole('button', { name: /Más/ })
    expect(more).toHaveAttribute('aria-expanded', 'true')
    expect(more).toHaveAttribute('aria-controls', 'primary-sidebar')
    fireEvent.click(more)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('is hidden on desktop through its responsive class', () => {
    renderBar()
    expect(screen.getByRole('navigation', { name: 'Accesos rápidos' }).className).toContain('md:hidden')
  })

  it('the customer set links to booking and their appointments', () => {
    renderBar('/booking', {}, CUSTOMER_TABS)
    expect(screen.getByRole('link', { name: /Reservar/ })).toHaveAttribute('href', '/booking')
    expect(screen.getByRole('link', { name: /Reservar/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /Mis turnos/ })).toHaveAttribute('href', '/appointments')
  })

  it('the staff set links to Turnos and availability', () => {
    renderBar('/staff/schedule', {}, STAFF_TABS)
    expect(screen.getByRole('link', { name: /Turnos/ })).toHaveAttribute('href', '/staff/appointments')
    expect(screen.getByRole('link', { name: /Disponibilidad/ })).toHaveAttribute('aria-current', 'page')
  })

  it('every tab of every role points to a known route (edge case)', async () => {
    const { isKnownRoute } = await import('../../../lib/routing')
    for (const tab of [...ADMIN_TABS, ...CUSTOMER_TABS, ...STAFF_TABS]) {
      expect(isKnownRoute(tab.href), tab.href).toBe(true)
    }
  })

  it('keeps "Mis turnos" marked on its sub-pages (edge case)', () => {
    renderBar('/appointments/abc/reschedule', {}, CUSTOMER_TABS)
    expect(screen.getByRole('link', { name: /Mis turnos/ })).toHaveAttribute('aria-current', 'page')
  })
})
