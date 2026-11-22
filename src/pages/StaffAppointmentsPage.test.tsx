import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { StaffAppointmentsPage } from './StaffAppointmentsPage'

vi.mock('./AdminAppointmentsPage', () => ({
  AdminAppointmentsPage: ({ mode }: { mode?: string }) => <div>Turnos en modo {mode}</div>,
}))

describe('StaffAppointmentsPage', () => {
  it('is the admin Turnos screen in staff mode (same UI, own appointments)', () => {
    render(
      <MemoryRouter>
        <StaffAppointmentsPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Turnos en modo staff')).toBeInTheDocument()
  })
})
