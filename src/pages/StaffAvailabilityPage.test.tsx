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
    pmStartsAt: null,
    pmEndsAt: null,
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
  pmStartsAt: null,
  pmEndsAt: null,
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

  it('explains that the availability defines the appointments the client sees', async () => {
    renderPage()
    expect(await screen.findByText('Esto define los turnos que ve el cliente.')).toBeInTheDocument()
    expect(screen.getByText(/solo pueden reservar con este profesional en los días y horarios que figuran acá/)).toBeInTheDocument()
    expect(screen.getByText(/los días libres y especiales también quitan o cambian esos turnos/)).toBeInTheDocument()
  })

  it('does not show the explanation while loading or when the professional is missing (edge case)', async () => {
    vi.mocked(staffAvailabilityService.getStaffWeeklySchedule).mockReturnValue(new Promise(() => {}))
    vi.mocked(staffAvailabilityService.listStaffExceptions).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.queryByText('Esto define los turnos que ve el cliente.')).toBeNull()
  })

  it('renders schedule editor and exception sections after load', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Horario semanal')).toBeInTheDocument()
    })

    expect(screen.getByRole('tab', { name: 'Días libres y especiales' })).toBeInTheDocument()
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
    fireEvent.click(await screen.findByRole('tab', { name: 'Días libres y especiales' }))

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
    fireEvent.click(await screen.findByRole('tab', { name: 'Días libres y especiales' }))

    await waitFor(() => {
      expect(screen.getByText('Eliminar')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Eliminar'))

    await waitFor(() => {
      expect(screen.getByText('Día eliminado correctamente.')).toBeInTheDocument()
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

describe('StaffAvailabilityPage — unsaved changes', () => {
  beforeEach(() => {
    vi.mocked(staffAvailabilityService.setStaffWeeklySchedule).mockClear()
    vi.mocked(staffAvailabilityService.getStaffWeeklySchedule).mockResolvedValue(mockSchedule)
    vi.mocked(staffAvailabilityService.listStaffExceptions).mockResolvedValue([mockException])
  })

  async function editSchedule() {
    renderPage()
    fireEvent.click(await screen.findByLabelText(/^Martes trabaja/))
    expect(await screen.findByText(/Tenés cambios sin guardar\. Apretá/)).toBeInTheDocument()
  }

  it('the Guardar horario button stays, with a notice that changes are not saved on their own', async () => {
    await editSchedule()
    expect(screen.getByRole('button', { name: 'Guardar horario' })).toBeInTheDocument()
    expect(screen.getByText(/no se guardan solos/)).toBeInTheDocument()
  })

  it('changing section with unsaved changes asks first; "Volver y guardar" stays on the schedule', async () => {
    await editSchedule()
    fireEvent.click(screen.getByRole('tab', { name: 'Días libres y especiales' }))
    expect(screen.getByText('Tenés cambios sin guardar')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Volver y guardar' }))
    expect(screen.getByRole('tab', { name: 'Horario semanal' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'Guardar horario' })).toBeInTheDocument()
  })

  it('"Salir sin guardar" changes section and drops the changes', async () => {
    await editSchedule()
    fireEvent.click(screen.getByRole('tab', { name: 'Días libres y especiales' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salir sin guardar' }))
    expect(screen.getByRole('tab', { name: 'Días libres y especiales' })).toHaveAttribute('aria-selected', 'true')
    expect(staffAvailabilityService.setStaffWeeklySchedule).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('tab', { name: 'Horario semanal' }))
    expect(screen.queryByText(/Tenés cambios sin guardar\. Apretá/)).toBeNull()
    expect(screen.queryByText('Tenés cambios sin guardar')).toBeNull()
  })

  it('the way back to Profesionales asks too, and leaves if confirmed', async () => {
    await editSchedule()
    fireEvent.click(screen.getByRole('button', { name: /Profesionales/ }))
    expect(screen.getByText('Tenés cambios sin guardar')).toBeInTheDocument()
    expect(screen.queryByText('Staff List')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Salir sin guardar' }))
    expect(await screen.findByText('Staff List')).toBeInTheDocument()
  })

  it('with nothing changed nothing is asked, neither on tabs nor on the way back (edge case)', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('tab', { name: 'Días libres y especiales' }))
    expect(screen.queryByText('Tenés cambios sin guardar')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Profesionales/ }))
    expect(await screen.findByText('Staff List')).toBeInTheDocument()
  })

  it('the browser warns before closing only while there are unsaved changes (edge case)', async () => {
    renderPage()
    await screen.findByLabelText(/^Martes trabaja/)
    const clean = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(clean)
    expect(clean.defaultPrevented).toBe(false)
    fireEvent.click(screen.getByLabelText(/^Martes trabaja/))
    await screen.findByText(/Tenés cambios sin guardar\. Apretá/)
    const dirty = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(dirty)
    expect(dirty.defaultPrevented).toBe(true)
  })

  it('undoing the change before leaving asks nothing (edge case)', async () => {
    await editSchedule()
    fireEvent.click(screen.getByLabelText(/^Martes trabaja/))
    await waitFor(() => expect(screen.queryByText(/Tenés cambios sin guardar\. Apretá/)).toBeNull())
    fireEvent.click(screen.getByRole('tab', { name: 'Días libres y especiales' }))
    expect(screen.queryByText('Tenés cambios sin guardar')).toBeNull()
  })
})
