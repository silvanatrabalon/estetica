import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'

const mockUseUser = vi.fn()
vi.mock('../hooks/useUser', () => ({ useUser: () => mockUseUser() }))
vi.mock('../components/staff/StaffDashboard', () => ({
  StaffDashboard: () => <div>Resumen de staff</div>,
}))
vi.mock('../components/customer/CustomerDashboard', () => ({
  CustomerDashboard: () => <div>Resumen de cliente</div>,
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
    expect(screen.queryByText('Resumen de cliente')).toBeNull()
  })

  it('shows the client summary, in the same layout, when the active role is customer', () => {
    mockUseUser.mockReturnValue({ profile: { name: 'Ana' }, activeRole: 'customer' })
    renderPage()
    expect(screen.getByText('Resumen de cliente')).toBeInTheDocument()
    expect(screen.queryByText('Resumen de staff')).toBeNull()
  })

  it('a staff member who is also a customer sees the client view when acting as customer (edge case)', () => {
    mockUseUser.mockReturnValue({ profile: { name: 'Sil' }, activeRole: 'customer' })
    renderPage()
    expect(screen.getByText('Resumen de cliente')).toBeInTheDocument()
  })

  it('does not show the old shortcut cards nor a link to the site (edge case)', () => {
    mockUseUser.mockReturnValue({ profile: { name: 'Ana' }, activeRole: 'customer' })
    renderPage()
    expect(screen.queryByText('Mi perfil')).toBeNull()
    expect(screen.queryByRole('link', { name: /Ir al sitio web/ })).toBeNull()
  })
})
