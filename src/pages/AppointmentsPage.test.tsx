import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppointmentsPage } from './AppointmentsPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'
import type { AppointmentSummary } from '../services/appointments'

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockListAppointments = vi.fn()

const mockCancel = vi.fn()

vi.mock('../services/appointments', () => ({
  listMyCustomerAppointments: (...args: unknown[]) => mockListAppointments(...args),
  cancelAppointment: (...args: unknown[]) => mockCancel(...args),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const FUTURE_DATE = '2099-06-01T14:00:00Z'
const PAST_DATE = '2020-01-01T14:00:00Z'
const APT_ID_1 = 'aaaabbbb-cccc-dddd-eeee-123456789001'
const APT_ID_2 = 'aaaabbbb-cccc-dddd-eeee-123456789002'

const upcomingApt: AppointmentSummary = {
  id: APT_ID_1,
  startsAt: FUTURE_DATE,
  endsAt: '2099-06-01T15:00:00Z',
  status: 'confirmed',
  createdAt: '2099-05-01T10:00:00Z',
  customerUserId: 'user-customer-123',
  serviceName: 'Corte de cabello',
  serviceDurationMinutes: 60,
  servicePriceCents: 5000,
  staffDisplayName: 'María López',
  orgName: 'Estética Moderna',
  orgTimezone: 'America/Argentina/Buenos_Aires',
  customerName: 'Juan Pérez',
}

const pastApt: AppointmentSummary = {
  id: APT_ID_2,
  startsAt: PAST_DATE,
  endsAt: '2020-01-01T15:00:00Z',
  status: 'completed',
  createdAt: '2019-12-01T10:00:00Z',
  customerUserId: 'user-customer-123',
  serviceName: 'Tinte',
  serviceDurationMinutes: 90,
  servicePriceCents: 8000,
  staffDisplayName: 'Carlos Rodríguez',
  orgName: 'Estética Moderna',
  orgTimezone: 'America/Argentina/Buenos_Aires',
  customerName: 'Juan Pérez',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderPage(url = '/appointments') {
  return render(
    <TestUserProvider {...mockSessions.authenticatedCustomer}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/appointments/:id?" element={<AppointmentsPage />} />
        </Routes>
      </MemoryRouter>
    </TestUserProvider>,
  )
}

const cancelledApt: AppointmentSummary = { ...upcomingApt, id: 'aaaabbbb-cccc-dddd-eeee-123456789003', status: 'cancelled', serviceName: 'Manicura' }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppointmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAppointments.mockResolvedValue([upcomingApt, pastApt])
  })

  describe('states', () => {
    it('shows loading text while fetching', () => {
      mockListAppointments.mockReturnValue(new Promise(() => {}))
      renderPage()
      expect(screen.getByText('Cargando turnos...')).toBeInTheDocument()
    })

    it('shows the error when the appointments cannot be loaded (edge case)', async () => {
      mockListAppointments.mockRejectedValue(new Error('boom'))
      renderPage()
      expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error al cargar tus turnos.')
    })
  })

  describe('list, in the same layout as the professional\'s Turnos', () => {
    it('has the same pieces as the professional\'s Turnos: title, search, period and state filters', async () => {
      renderPage()
      expect(await screen.findByRole('heading', { name: 'Mis turnos' })).toBeInTheDocument()
      expect(screen.getByRole('searchbox', { name: 'Buscar turno' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Filtrar por período' })).toHaveTextContent('Próximos')
      expect(screen.getByRole('button', { name: 'Filtrar por estado' })).toBeInTheDocument()
    })

    it('has the same period options as the professional\'s list', async () => {
      renderPage()
      fireEvent.click(await screen.findByRole('button', { name: 'Filtrar por período' }))
      expect(screen.getAllByRole('menuitemradio').map((o) => (o.textContent ?? '').replace(/[^\p{L} ]/gu, '').trim())).toEqual([
        'Hoy',
        'Esta semana',
        'Este mes',
        'Próximos',
        'Historial',
        'Todos',
      ])
    })

    it('has no Lista/Calendario views nor + Reservar button, like the professional\'s list (edge case)', async () => {
      renderPage()
      await screen.findByText('Corte de cabello')
      expect(screen.queryByRole('tab')).toBeNull()
      expect(screen.queryByRole('link', { name: '+ Reservar' })).toBeNull()
    })

    it('opens on the upcoming ones: service, professional, status and date, linking to its detail', async () => {
      renderPage()
      const card = (await screen.findByText('Corte de cabello')).closest('a') as HTMLElement
      expect(card).toHaveAttribute('href', `/appointments/${APT_ID_1}`)
      expect(card).toHaveTextContent('con María López')
      expect(card).toHaveTextContent('Confirmado')
      expect(screen.queryByText('Tinte')).toBeNull()
    })

    it('the cards are colored by status like the other lists', async () => {
      renderPage()
      const card = (await screen.findByText('Corte de cabello')).closest('a') as HTMLElement
      expect(card.className).toContain('border-l-emerald-500')
    })

    it('the Historial period shows the past ones', async () => {
      renderPage()
      await screen.findByText('Corte de cabello')
      fireEvent.click(screen.getByRole('button', { name: 'Filtrar por período' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Historial' }))
      expect(screen.getByText('Tinte')).toBeInTheDocument()
      expect(screen.getByText('Completado')).toBeInTheDocument()
      expect(screen.queryByText('Corte de cabello')).toBeNull()
    })

    it('Todos shows both, and the status filter narrows them (edge case)', async () => {
      mockListAppointments.mockResolvedValue([upcomingApt, pastApt, cancelledApt])
      renderPage()
      await screen.findByText('Corte de cabello')
      fireEvent.click(screen.getByRole('button', { name: 'Filtrar por período' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Todos' }))
      expect(screen.getByText('Tinte')).toBeInTheDocument()
      expect(screen.getByText('Manicura')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Filtrar por estado' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Cancelado' }))
      expect(screen.getByText('Manicura')).toBeInTheDocument()
      expect(screen.queryByText('Tinte')).toBeNull()
      expect(screen.queryByText('Corte de cabello')).toBeNull()
    })

    it('a cancelled appointment in the future is listed in Próximos, as in the professional\'s list (edge case)', async () => {
      mockListAppointments.mockResolvedValue([cancelledApt])
      renderPage()
      const card = (await screen.findByText('Manicura')).closest('a') as HTMLElement
      expect(card).toHaveTextContent('Cancelado')
    })

    it('searches by service or professional, ignoring case and accents of nothing else (edge cases)', async () => {
      mockListAppointments.mockResolvedValue([upcomingApt, { ...upcomingApt, id: 'x2', serviceName: 'Manicura', staffDisplayName: 'Lucía' }])
      renderPage()
      await screen.findByText('Corte de cabello')
      fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar turno' }), { target: { value: 'LUCÍA' } })
      expect(screen.getByText('Manicura')).toBeInTheDocument()
      expect(screen.queryByText('Corte de cabello')).toBeNull()
      fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar turno' }), { target: { value: 'corte' } })
      expect(screen.getByText('Corte de cabello')).toBeInTheDocument()
      expect(screen.queryByText('Manicura')).toBeNull()
    })

    it('says what was searched when nothing matches, and the usual text without a search (edge cases)', async () => {
      renderPage()
      await screen.findByText('Corte de cabello')
      fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar turno' }), { target: { value: 'zzz' } })
      expect(screen.getByText('No encontramos turnos para “zzz” con estos filtros.')).toBeInTheDocument()
      fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar turno' }), { target: { value: '  ' } })
      expect(screen.getByText('Corte de cabello')).toBeInTheDocument()
    })

    it('Hoy and the other periods use the date of each turn (edge cases)', async () => {
      const today = new Date()
      today.setHours(12, 0, 0, 0)
      const todayApt = { ...upcomingApt, id: 'today1', serviceName: 'Facial de hoy', startsAt: today.toISOString() }
      mockListAppointments.mockResolvedValue([upcomingApt, pastApt, todayApt])
      renderPage()
      await screen.findByText('Corte de cabello')
      fireEvent.click(screen.getByRole('button', { name: 'Filtrar por período' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: /Hoy/ }))
      expect(screen.getByText('Facial de hoy')).toBeInTheDocument()
      expect(screen.queryByText('Corte de cabello')).toBeNull()
      expect(screen.queryByText('Tinte')).toBeNull()
    })

    it('says there is nothing for the filters, in the professional\'s words (edge case)', async () => {
      mockListAppointments.mockResolvedValue([upcomingApt])
      renderPage()
      await screen.findByText('Corte de cabello')
      fireEvent.click(screen.getByRole('button', { name: 'Filtrar por período' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Historial' }))
      expect(screen.getByText('No hay turnos que coincidan con los filtros.')).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Filtrar por estado' }))
      fireEvent.click(screen.getByRole('menuitemradio', { name: 'Cancelado' }))
      expect(screen.getByText('No hay turnos que coincidan con los filtros.')).toBeInTheDocument()
    })

    it('a client with no appointments at all sees the empty state (edge case)', async () => {
      mockListAppointments.mockResolvedValue([])
      renderPage()
      expect(await screen.findByText('No hay turnos que coincidan con los filtros.')).toBeInTheDocument()
    })

    it('opens with the period and state from the URL (edge case)', async () => {
      renderPage('/appointments?periodo=past&estado=completed')
      expect(await screen.findByText('Tinte')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Filtrar por período' })).toHaveTextContent('Historial')
    })
  })

  describe('detail pop-up', () => {
    it('opens over the list when the URL has the appointment id, with its data', async () => {
      renderPage(`/appointments/${APT_ID_1}`)
      const dialog = await screen.findByRole('dialog', { name: 'Detalle del turno' })
      expect(dialog).toHaveTextContent('Corte de cabello')
      expect(dialog).toHaveTextContent('María López')
      expect(dialog).toHaveTextContent('60 min')
      expect(dialog).toHaveTextContent('#56789001')
      expect(screen.getByRole('heading', { name: 'Mis turnos' })).toBeInTheDocument()
    })

    it('an upcoming appointment can be rescheduled, cancelled and its confirmation seen', async () => {
      renderPage(`/appointments/${APT_ID_1}`)
      await screen.findByRole('dialog')
      expect(screen.getByRole('link', { name: 'Reprogramar' })).toHaveAttribute('href', `/appointments/${APT_ID_1}/reschedule`)
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Ver confirmación' })).toHaveAttribute('href', `/booking/confirmation/${APT_ID_1}`)
    })

    it('a past or cancelled appointment cannot be changed (edge case)', async () => {
      renderPage(`/appointments/${APT_ID_2}`)
      await screen.findByRole('dialog')
      expect(screen.queryByRole('link', { name: 'Reprogramar' })).toBeNull()
      expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull()
      expect(screen.getByText('Este turno ya no se puede modificar.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Ver confirmación' })).toBeInTheDocument()
    })

    it('cancelling asks first, and the list behind shows it as cancelled', async () => {
      mockCancel.mockResolvedValue(undefined)
      renderPage(`/appointments/${APT_ID_1}`)
      await screen.findByRole('dialog')
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      expect(mockCancel).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }))
      await waitFor(() => expect(mockCancel).toHaveBeenCalledWith({ appointmentId: APT_ID_1 }))
      await waitFor(() => expect(screen.getAllByText('Cancelado').length).toBeGreaterThan(0))
      expect(screen.queryByRole('button', { name: 'Sí, cancelar' })).toBeNull()
    })

    it('going back from the confirmation keeps the appointment (edge case)', async () => {
      renderPage(`/appointments/${APT_ID_1}`)
      await screen.findByRole('dialog')
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
      expect(mockCancel).not.toHaveBeenCalled()
      expect(screen.getByRole('link', { name: 'Reprogramar' })).toBeInTheDocument()
    })

    it('a failed cancel shows the message inside the pop-up and keeps the appointment (edge case)', async () => {
      mockCancel.mockRejectedValue(new Error('No se pudo cancelar.'))
      renderPage(`/appointments/${APT_ID_1}`)
      await screen.findByRole('dialog')
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      fireEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }))
      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('No se pudo cancelar.')
      expect(screen.getByRole('dialog')).toContainElement(alert)
      expect(screen.getByRole('dialog')).toHaveTextContent('Confirmado')
    })

    it('the X and Escape go back to the list', async () => {
      renderPage(`/appointments/${APT_ID_1}`)
      await screen.findByRole('dialog')
      fireEvent.click(screen.getByRole('button', { name: 'Volver a mis turnos' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })

    it('an id that is not in the client\'s list says so, without leaking anything (edge case)', async () => {
      renderPage('/appointments/otro-turno-de-otra-persona')
      expect(await screen.findByText('No encontramos este turno.')).toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Reprogramar' })).toBeNull()
    })
  })
})
