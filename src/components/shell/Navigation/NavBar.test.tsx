import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NavBar } from './NavBar'
import { AdminShell } from '../AdminShell'
import { CustomerShell } from '../CustomerShell'
import { StaffShell } from '../StaffShell'
import { TestShellProvider, TestUserProvider } from '../../../hooks/__test-utils__/test-providers'
import { mockSessions } from '../../../hooks/__test-utils__/fixtures'

vi.mock('../../../services/brand', () => ({
  getBrandSettings: () => Promise.resolve({ logoUrl: null, bookingHeaderText: null, bookingSubtitleText: null }),
}))

type Session = typeof mockSessions.authenticatedAdmin

function wrap(ui: React.ReactNode, session: Session = mockSessions.authenticatedAdmin, onToggle = vi.fn()) {
  return render(
    <MemoryRouter>
      <TestUserProvider user={session.user} roles={session.roles} activeRole={session.activeRole} isLoading={false}>
        <TestShellProvider onToggleMobileMenu={onToggle}>{ui}</TestShellProvider>
      </TestUserProvider>
    </MemoryRouter>,
  )
}

const HEADER_MENU_BUTTON = { name: 'Alternar menú de navegación' }

describe('NavBar', () => {
  it('has no menu button in the header: the menu opens from "Más" at the bottom', () => {
    wrap(<NavBar />)
    expect(screen.queryByRole('button', HEADER_MENU_BUTTON)).toBeNull()
  })

  it('keeps the user menu trigger', () => {
    wrap(<NavBar />)
    expect(document.querySelector('button[aria-haspopup="menu"]')).not.toBeNull()
  })

  it('renders nothing without a signed-in user (edge case)', () => {
    const { container } = render(
      <MemoryRouter>
        <TestUserProvider user={null} roles={[]} activeRole={null} isLoading={false}>
          <TestShellProvider>
            <NavBar />
          </TestShellProvider>
        </TestUserProvider>
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})

describe.each([
  ['admin', AdminShell, mockSessions.authenticatedAdmin, ['Inicio', 'Turnos']],
  ['customer', CustomerShell, mockSessions.authenticatedCustomer, ['Inicio', 'Reservar', 'Mis turnos']],
  ['staff', StaffShell, mockSessions.authenticatedStaff, ['Inicio', 'Agenda', 'Disponibilidad']],
] as const)('%s shell on a phone', (_role, Shell, session, labels) => {
  it('has the bottom bar with its own shortcuts plus "Más", and no header hamburger', () => {
    wrap(<Shell>contenido</Shell>, session)

    const bar = screen.getByRole('navigation', { name: 'Accesos rápidos' })
    const names = Array.from(bar.querySelectorAll('a')).map((a) => a.textContent)
    expect(names).toEqual(labels)
    expect(screen.getByRole('button', { name: /Más/ })).toBeDefined()
    expect(screen.queryByRole('button', HEADER_MENU_BUTTON)).toBeNull()
  })

  it('"Más" opens the full menu', () => {
    const onToggle = vi.fn()
    wrap(<Shell>contenido</Shell>, session, onToggle)

    fireEvent.click(screen.getByRole('button', { name: /Más/ }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('leaves room under the content so the last row is not hidden by the bar (edge case)', () => {
    wrap(<Shell>contenido final</Shell>, session)
    expect(screen.getByText('contenido final').className).toContain('pb-20')
  })
})
