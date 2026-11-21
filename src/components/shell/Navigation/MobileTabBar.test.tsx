import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MobileTabBar } from './MobileTabBar'
import { TestShellProvider } from '../../../hooks/__test-utils__/test-providers'

function renderBar(path = '/admin/dashboard', props: { onToggleMobileMenu?: () => void; isMobileMenuOpen?: boolean } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TestShellProvider {...props}>
        <MobileTabBar />
      </TestShellProvider>
    </MemoryRouter>,
  )
}

describe('MobileTabBar', () => {
  it('offers the three daily shortcuts and the full menu', () => {
    renderBar()
    expect(screen.getByRole('navigation', { name: 'Accesos rápidos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Inicio/ })).toHaveAttribute('href', '/admin/dashboard')
    expect(screen.getByRole('link', { name: /Turnos/ })).toHaveAttribute('href', '/admin/appointments')
    expect(screen.getByRole('link', { name: /Calendario/ })).toHaveAttribute('href', '/admin/calendar')
    expect(screen.getByRole('button', { name: /Más/ })).toBeInTheDocument()
  })

  it('marks the current section', () => {
    renderBar('/admin/calendar')
    expect(screen.getByRole('link', { name: /Calendario/ })).toHaveAttribute('aria-current', 'page')
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
})
