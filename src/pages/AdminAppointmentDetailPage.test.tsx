import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { pickOption } from '../hooks/__test-utils__/select'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminAppointmentDetailPage } from './AdminAppointmentDetailPage'

const mocks = vi.hoisted(() => ({
  getAdminAppointment: vi.fn(),
  getStaffAppointment: vi.fn(),
  listStaffForService: vi.fn(),
  adminUpdateAppointment: vi.fn(),
  cancelAppointment: vi.fn(),
  listServices: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock('../services/adminAppointments', async () => {
  const actual = await vi.importActual<typeof import('../services/adminAppointments')>(
    '../services/adminAppointments',
  )
  return {
    ...actual,
    getAdminAppointment: mocks.getAdminAppointment,
    getStaffAppointment: mocks.getStaffAppointment,
    listStaffForService: mocks.listStaffForService,
    adminUpdateAppointment: mocks.adminUpdateAppointment,
  }
})
vi.mock('../services/appointments', () => ({ cancelAppointment: mocks.cancelAppointment }))
vi.mock('../services/adminServices', () => ({ listServices: mocks.listServices }))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mocks.navigate }
})

const userEvent = {
  setup: () => ({
    click: async (el: Element) => {
      fireEvent.click(el)
    },
    type: async (el: Element, text: string) => {
      fireEvent.change(el, { target: { value: (el as HTMLTextAreaElement).value + text } })
    },
    paste: async () => {},
  }),
}

const base = {
  id: 'a1',
  serviceId: 's1',
  staffMemberId: 'm1',
  startsAt: '2026-12-01T13:00:00Z',
  endsAt: '2026-12-01T14:00:00Z',
  status: 'confirmed',
  notes: null,
  createdAt: '2026-11-01T10:00:00Z',
  customerName: 'Ana Pérez',
  customerEmail: 'ana@mail.com',
  customerPhone: null,
  serviceName: 'Masaje',
  serviceDurationMinutes: 60,
  servicePriceCents: 500000,
  staffDisplayName: 'Lucía',
  orgTimezone: 'America/Argentina/Buenos_Aires',
}

function renderStaffPage() {
  return render(
    <MemoryRouter initialEntries={['/staff/appointments/a1']}>
      <Routes>
        <Route path="/staff/appointments/:id" element={<AdminAppointmentDetailPage mode="staff" />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/appointments/a1']}>
      <Routes>
        <Route path="/admin/appointments/:id" element={<AdminAppointmentDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getAdminAppointment.mockResolvedValue(base)
  mocks.getStaffAppointment.mockResolvedValue(base)
  mocks.listStaffForService.mockResolvedValue([
    { staffMemberId: 'm1', displayName: 'Lucía' },
    { staffMemberId: 'm2', displayName: 'Marta' },
  ])
  mocks.listServices.mockResolvedValue([
    { id: 's1', name: 'Masaje', isActive: true },
    { id: 's2', name: 'Facial', isActive: true },
  ])
})

describe('AdminAppointmentDetailPage', () => {
  it('muestra el detalle y las tres acciones', async () => {
    renderPage()
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.queryByText('Teléfono')).not.toBeInTheDocument()
    expect(screen.queryByText('Nota interna')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reprogramar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('turno inexistente muestra mensaje y sin acciones', async () => {
    mocks.getAdminAppointment.mockResolvedValue(null)
    renderPage()
    expect(await screen.findByText('No encontramos este turno.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('error de carga muestra alerta', async () => {
    mocks.getAdminAppointment.mockRejectedValue(new Error('boom'))
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar el turno.')
  })

  it.each(['cancelled', 'no_show'])('turno %s no ofrece acciones', async (status) => {
    mocks.getAdminAppointment.mockResolvedValue({ ...base, status })
    renderPage()
    await screen.findByText('Ana Pérez')
    expect(screen.queryByRole('button', { name: 'Reprogramar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    expect(screen.getByText(/ya no se puede modificar/)).toBeInTheDocument()
  })

  it('un turno completado se puede editar, reprogramar y cancelar (edge case)', async () => {
    mocks.getAdminAppointment.mockResolvedValue({ ...base, status: 'completed' })
    renderPage()
    await screen.findByText('Ana Pérez')
    expect(screen.getByRole('button', { name: 'Reprogramar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(screen.queryByText(/ya no se puede modificar/)).not.toBeInTheDocument()
  })

  it('reprogramar navega indicando a dónde volver', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Reprogramar' }))
    expect(mocks.navigate).toHaveBeenCalledWith('/appointments/a1/reschedule', {
      state: { returnTo: '/admin/appointments/a1' },
    })
  })

  it('cancelar pide confirmación y no cancela si se vuelve atrás', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Volver' }))
    expect(mocks.cancelAppointment).not.toHaveBeenCalled()
  })

  it('cancelar confirmado llama al servicio y recarga', async () => {
    const user = userEvent.setup()
    mocks.cancelAppointment.mockResolvedValue(undefined)
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))
    mocks.getAdminAppointment.mockResolvedValue({ ...base, status: 'cancelled' })
    await user.click(screen.getByRole('button', { name: 'Sí, cancelar' }))
    await waitFor(() => expect(mocks.cancelAppointment).toHaveBeenCalledWith({ appointmentId: 'a1' }))
    expect(await screen.findByText('El turno fue cancelado.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })

  it('error al cancelar muestra el mensaje y mantiene el turno', async () => {
    const user = userEvent.setup()
    mocks.cancelAppointment.mockRejectedValue(new Error('No se puede cancelar.'))
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Sí, cancelar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se puede cancelar.')
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
  })

  it('editar guarda servicio y profesional conservando la nota existente', async () => {
    const user = userEvent.setup()
    mocks.getAdminAppointment.mockResolvedValue({ ...base, notes: 'Alérgica' })
    mocks.adminUpdateAppointment.mockResolvedValue(undefined)
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    await screen.findByLabelText('Servicio')
    expect(screen.queryByLabelText('Nota interna')).not.toBeInTheDocument()
    await pickOption('Profesional', 'Marta')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() =>
      expect(mocks.adminUpdateAppointment).toHaveBeenCalledWith({
        appointmentId: 'a1',
        serviceId: 's1',
        staffMemberId: 'm2',
        notes: 'Alérgica',
      }),
    )
    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()
  })

  it('sin nota previa no inventa una (edge case)', async () => {
    const user = userEvent.setup()
    mocks.adminUpdateAppointment.mockResolvedValue(undefined)
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    await screen.findByLabelText('Servicio')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() =>
      expect(mocks.adminUpdateAppointment).toHaveBeenCalledWith(expect.objectContaining({ notes: '' })),
    )
  })

  it('al cambiar de servicio se limpia el profesional si ya no lo realiza', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    await screen.findByLabelText('Servicio')
    mocks.listStaffForService.mockResolvedValue([{ staffMemberId: 'm3', displayName: 'Rosa' }])
    await pickOption('Servicio', 'Facial')
    await waitFor(() => expect(screen.getByLabelText('Profesional').textContent).toContain('Elegí un profesional'))
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })

  it('servicio sin profesionales avisa y no permite guardar', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    await screen.findByLabelText('Servicio')
    mocks.listStaffForService.mockResolvedValue([])
    await pickOption('Servicio', 'Facial')
    expect(await screen.findByText('Ningún profesional activo realiza este servicio.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })

  it('conflicto de horario se muestra y se sigue en edición', async () => {
    const user = userEvent.setup()
    mocks.adminUpdateAppointment.mockRejectedValue(new Error('El profesional ya tiene otro turno en ese horario.'))
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    await screen.findByLabelText('Servicio')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('ya tiene otro turno')
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled()
  })

  it('descartar cierra la edición sin guardar', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    await screen.findByLabelText('Servicio')
    await user.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(mocks.adminUpdateAppointment).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
  })

  describe('staff mode', () => {
    it('loads through the staff service and shows reprogramar and cancelar but not editar', async () => {
      renderStaffPage()
      expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
      expect(mocks.getStaffAppointment).toHaveBeenCalledWith('a1')
      expect(mocks.getAdminAppointment).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'Reprogramar' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    })

    it('goes back to Turnos and returns there after reprogramar', async () => {
      const user = userEvent.setup()
      renderStaffPage()
      expect(await screen.findByRole('link', { name: 'Volver a turnos' })).toHaveAttribute('href', '/staff/appointments')
      await user.click(screen.getByRole('button', { name: 'Reprogramar' }))
      expect(mocks.navigate).toHaveBeenCalledWith('/appointments/a1/reschedule', {
        state: { returnTo: '/staff/appointments/a1' },
      })
    })

    it('an appointment that is not theirs shows "no encontramos" (edge case)', async () => {
      mocks.getStaffAppointment.mockResolvedValue(null)
      renderStaffPage()
      expect(await screen.findByText('No encontramos este turno.')).toBeInTheDocument()
    })
  })
})
