import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'

const mockUseUser = vi.fn()
vi.mock('../hooks/useUser', () => ({ useUser: () => mockUseUser() }))
vi.mock('../components/staff/StaffDashboard', () => ({
  StaffDashboard: () => <div>Resumen de staff</div>,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  it('shows the staff summary when the active role is staff', () => {
    mockUseUser.mockReturnValue({ profile: { name: 'Sil' }, activeRole: 'staff' })
    renderPage()
    expect(screen.getByText('Resumen de staff')).toBeInTheDocument()
    expect(screen.queryByText('Reservar turno')).toBeNull()
  })

  it('keeps the customer shortcuts for customers', () => {
    mockUseUser.mockReturnValue({ profile: { name: 'Ana' }, activeRole: 'customer' })
    renderPage()
    expect(screen.getByText('Reservar turno')).toBeInTheDocument()
    expect(screen.queryByText('Resumen de staff')).toBeNull()
  })

  it('a staff member who is also a customer sees the customer view when acting as customer (edge case)', () => {
    mockUseUser.mockReturnValue({ profile: { name: 'Sil' }, activeRole: 'customer' })
    renderPage()
    expect(screen.getByText('Mis turnos')).toBeInTheDocument()
  })

  it('does not show a "Mi perfil" shortcut (it lives in the account menu) (edge case)', () => {
    mockUseUser.mockReturnValue({ profile: { name: 'Ana' }, activeRole: 'customer' })
    renderPage()
    expect(screen.queryByText('Mi perfil')).toBeNull()
  })

  it('links to the public site with a friendly label', () => {
    mockUseUser.mockReturnValue({ profile: { name: 'Ana' }, activeRole: 'customer' })
    renderPage()
    expect(screen.getByRole('link', { name: /Ir al sitio web/ })).toHaveAttribute('href', '/')
    expect(screen.queryByText(/página principal/i)).toBeNull()
  })
})
