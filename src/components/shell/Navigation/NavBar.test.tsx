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

function wrap(
  ui: React.ReactNode,
  session: Session = mockSessions.authenticatedAdmin,
  onToggle = vi.fn(),
  sidebar: { isSidebarOpen?: boolean; onToggleSidebar?: () => void } = {},
) {
  return render(
    <MemoryRouter>
      <TestUserProvider user={session.user} roles={session.roles} activeRole={session.activeRole} isLoading={false}>
        <TestShellProvider onToggleMobileMenu={onToggle} {...sidebar}>
          {ui}
        </TestShellProvider>
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
  ['staff', StaffShell, mockSessions.authenticatedStaff, ['Inicio', 'Turnos', 'Disponibilidad']],
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

describe.each([
  ['admin', AdminShell, mockSessions.authenticatedAdmin],
  ['staff', StaffShell, mockSessions.authenticatedStaff],
  ['customer', CustomerShell, mockSessions.authenticatedCustomer],
] as const)('%s shell: side menu on desktop', (_role, Shell, session) => {
  it('has a button that hides the menu and the layout uses the full width once hidden', () => {
    const onToggleSidebar = vi.fn()
    const { container, rerender } = wrap(<Shell>contenido</Shell>, session, vi.fn(), { onToggleSidebar })
    const hide = screen.getByRole('button', { name: 'Ocultar menú lateral' })
    expect(hide).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('complementary', { name: 'Navegación principal' }).className).not.toContain('md:hidden')
    expect(container.firstElementChild!.className).toContain('md:grid-cols-[250px_1fr]')
    fireEvent.click(hide)
    expect(onToggleSidebar).toHaveBeenCalledTimes(1)

    rerender(
      <MemoryRouter>
        <TestUserProvider user={session.user} roles={session.roles} activeRole={session.activeRole} isLoading={false}>
          <TestShellProvider isSidebarOpen={false}>
            <Shell>contenido</Shell>
          </TestShellProvider>
        </TestUserProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Mostrar menú lateral' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('complementary', { name: 'Navegación principal', hidden: true }).className).toContain('md:hidden')
    expect(container.firstElementChild!.className).toContain('md:grid-cols-1')
    expect(container.firstElementChild!.className).not.toContain('250px')
  })

  it('the phone menu still opens from "Más" even if the desktop menu is hidden (edge case)', () => {
    const onToggle = vi.fn()
    wrap(<Shell>contenido</Shell>, session, onToggle, { isSidebarOpen: false })
    fireEvent.click(screen.getByRole('button', { name: /Más/ }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})

describe.each([
  ['admin', AdminShell, mockSessions.authenticatedAdmin],
  ['staff', StaffShell, mockSessions.authenticatedStaff],
  ['customer', CustomerShell, mockSessions.authenticatedCustomer],
] as const)('%s shell: "Ir al sitio" at the end of the menu', (_role, Shell, session) => {
  it('is the last entry of the side menu and opens the site', () => {
    wrap(<Shell>contenido</Shell>, session)
    const menu = screen.getByRole('complementary', { name: 'Navegación principal' })
    const links = Array.from(menu.querySelectorAll('a'))
    const last = links[links.length - 1]
    expect(last.textContent).toContain('Ir al sitio')
    expect(last).toHaveAttribute('href', '/?sitio=1')
    expect(links.filter((a) => a.textContent?.includes('Ir al sitio'))).toHaveLength(1)
  })

  it('closes the phone menu when it is used (edge case)', () => {
    const onClose = vi.fn()
    render(
      <MemoryRouter>
        <TestUserProvider user={session.user} roles={session.roles} activeRole={session.activeRole} isLoading={false}>
          <TestShellProvider onCloseMobileMenu={onClose}>
            <Shell>contenido</Shell>
          </TestShellProvider>
        </TestUserProvider>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('link', { name: /Ir al sitio/ }))
    expect(onClose).toHaveBeenCalled()
  })
})
