import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { StaffAvailabilityPage } from './StaffAvailabilityPage'
import * as staffAvailabilityService from '../services/staffAvailability'
import type { StaffScheduleDay, StaffScheduleException } from '../services/staffAvailability'

vi.mock('../services/staffAvailability')

const mockSchedule: StaffScheduleDay[] = [
  {
    id: 'sched-1',
    staffMemberId: 'staff-1',
    dayOfWeek: 1,
    isWorking: true,
    startsAt: '09:00',
    endsAt: '17:00',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

const mockException: StaffScheduleException = {
  id: 'exc-1',
  staffMemberId: 'staff-1',
  exceptionDate: '2025-12-25',
  exceptionType: 'day_off',
  startsAt: null,
  endsAt: null,
  reason: 'Navidad',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

function renderPage(staffId = 'staff-1') {
  return render(
    <MemoryRouter initialEntries={[`/admin/staff/${staffId}/availability`]}>
      <Routes>
        <Route path="/admin/staff/:staffId/availability" element={<StaffAvailabilityPage />} />
        <Route path="/admin/staff" element={<div>Staff List</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('StaffAvailabilityPage', () => {
  beforeEach(() => {
    vi.mocked(staffAvailabilityService.getStaffWeeklySchedule).mockResolvedValue(mockSchedule)
    vi.mocked(staffAvailabilityService.listStaffExceptions).mockResolvedValue([mockException])
    vi.mocked(staffAvailabilityService.setStaffWeeklySchedule).mockResolvedValue(mockSchedule)
    vi.mocked(staffAvailabilityService.addStaffException).mockResolvedValue(mockException)
    vi.mocked(staffAvailabilityService.removeStaffException).mockResolvedValue(undefined)
  })

  it('shows loading state while data is loading', () => {
    // Never resolve to keep loading state
    vi.mocked(staffAvailabilityService.getStaffWeeklySchedule).mockReturnValue(new Promise(() => {}))
    vi.mocked(staffAvailabilityService.listStaffExceptions).mockReturnValue(new Promise(() => {}))

    renderPage()
    expect(screen.getByText('Cargando disponibilidad...')).toBeInTheDocument()
  })

  it('renders schedule editor and exception sections after load', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Horario semanal')).toBeInTheDocument()
    })

    expect(screen.getByText('Excepciones')).toBeInTheDocument()
    expect(screen.getByText('Guardar horario')).toBeInTheDocument()
  })

  it('shows back link to staff list', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('← Profesionales')).toBeInTheDocument()
    })
  })

  it('navigates back to staff list when back link is clicked', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('← Profesionales')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('← Profesionales'))
    expect(screen.getByText('Staff List')).toBeInTheDocument()
  })

  it('shows exception in list after load', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/25 de diciembre/i)).toBeInTheDocument()
    })
  })

  it('shows success message after saving schedule', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Guardar horario')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Guardar horario'))

    await waitFor(() => {
      expect(screen.getByText('Horario guardado correctamente.')).toBeInTheDocument()
    })
  })

  it('shows success message after removing exception', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Eliminar')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Eliminar'))

    await waitFor(() => {
      expect(screen.getByText('Excepción eliminada correctamente.')).toBeInTheDocument()
    })
  })

  it('shows error message when save fails', async () => {
    vi.mocked(staffAvailabilityService.setStaffWeeklySchedule).mockRejectedValue(
      new Error('rpc error'),
    )

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Guardar horario')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Guardar horario'))

    await waitFor(() => {
      expect(screen.getByText('No pudimos guardar el horario. Intenta de nuevo.')).toBeInTheDocument()
    })
  })
})
