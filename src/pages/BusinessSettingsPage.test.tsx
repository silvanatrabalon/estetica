import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BusinessSettingsPage } from './BusinessSettingsPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockGetBusinessSettings = vi.fn()
const mockSaveBusinessSettings = vi.fn()
const mockSaveNotificationSettings = vi.fn()
const mockSaveBusinessClosure = vi.fn()
const mockDeleteBusinessClosure = vi.fn()
const mockUpdateBookingPolicy = vi.fn()

vi.mock('../services/businessSettings', () => ({
  getBusinessSettings: (...args: unknown[]) => mockGetBusinessSettings(...args),
  saveBusinessSettings: (...args: unknown[]) => mockSaveBusinessSettings(...args),
  saveNotificationSettings: (...args: unknown[]) => mockSaveNotificationSettings(...args),
  saveBusinessClosure: (...args: unknown[]) => mockSaveBusinessClosure(...args),
  deleteBusinessClosure: (...args: unknown[]) => mockDeleteBusinessClosure(...args),
  updateBookingPolicy: (...args: unknown[]) => mockUpdateBookingPolicy(...args),
}))

function createSettingsResponse(overrides?: Partial<Awaited<ReturnType<typeof mockGetBusinessSettings>>>) {
  return {
    organizationId: 'org-1',
    name: 'Salon Centro',
    slug: 'negocio-principal',
    timezone: 'America/Argentina/Buenos_Aires',
    logoUrl: null,
    primaryColor: '#123ABC',
    bookingHeaderText: 'Reserva tu turno',
    bookingSubtitleText: 'Atencion personalizada',
    weeklyHours: [
      { id: 'h-0', organizationId: 'org-1', dayOfWeek: 0, isClosed: true, opensAt: null, closesAt: null },
      { id: 'h-1', organizationId: 'org-1', dayOfWeek: 1, isClosed: false, opensAt: '09:00', closesAt: '18:00' },
      { id: 'h-2', organizationId: 'org-1', dayOfWeek: 2, isClosed: false, opensAt: '09:00', closesAt: '18:00' },
      { id: 'h-3', organizationId: 'org-1', dayOfWeek: 3, isClosed: false, opensAt: '09:00', closesAt: '18:00' },
      { id: 'h-4', organizationId: 'org-1', dayOfWeek: 4, isClosed: false, opensAt: '09:00', closesAt: '18:00' },
      { id: 'h-5', organizationId: 'org-1', dayOfWeek: 5, isClosed: false, opensAt: '09:00', closesAt: '18:00' },
      { id: 'h-6', organizationId: 'org-1', dayOfWeek: 6, isClosed: true, opensAt: null, closesAt: null },
    ],
    closures: [],
    readiness: { isReady: true, missing: [] },
    bookingMinNoticeMinutes: 60,
    bookingMaxHorizonDays: 60,
    notificationEmail: null,
    notificationsEnabled: true,
    ...overrides,
  }
}

function renderBusinessSettingsPage() {
  return render(
    <MemoryRouter>
      <TestUserProvider user={mockSessions.authenticatedAdmin.user} roles={['admin']} activeRole="admin" isLoading={false}>
        <BusinessSettingsPage />
      </TestUserProvider>
    </MemoryRouter>,
  )
}

describe('BusinessSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockGetBusinessSettings.mockResolvedValue(createSettingsResponse())
  })

  it('loads business settings and shows readiness warning when incomplete', async () => {
    mockGetBusinessSettings.mockResolvedValue(
      createSettingsResponse({
        readiness: { isReady: false, missing: ['weeklyHours'] },
      }),
    )

    renderBusinessSettingsPage()

    await waitFor(() => {
      expect(screen.getByText('Negocio')).toBeDefined()
      expect(screen.getByText(/Configuracion incompleta/)).toBeDefined()
    })
  })

  it('saves business identity and weekly hours', async () => {
    mockSaveBusinessSettings.mockResolvedValue(createSettingsResponse())

    renderBusinessSettingsPage()

    await waitFor(() => {
      expect(screen.getByDisplayValue('Salon Centro')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Salon Norte' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar configuracion del negocio' }))

    await waitFor(() => {
      expect(mockSaveBusinessSettings).toHaveBeenCalled()
      expect(screen.getByText('Configuracion del negocio guardada correctamente.')).toBeDefined()
    })

    expect(mockSaveBusinessSettings.mock.calls[0][0].name).toBe('Salon Norte')
    expect(mockSaveBusinessSettings.mock.calls[0][0].weeklyHours).toHaveLength(7)
  })

  it('creates a half-day closure and reloads data', async () => {
    mockSaveBusinessClosure.mockResolvedValue({
      id: 'c-1',
      organizationId: 'org-1',
      closureDate: '2026-05-20',
      closureType: 'half_day',
      startsAt: '13:00',
      endsAt: '17:00',
      reason: 'Capacitacion',
    })

    renderBusinessSettingsPage()

    await waitFor(() => {
      expect(screen.getByText('Cierres excepcionales')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-05-20' } })
    fireEvent.change(screen.getByLabelText('Tipo de cierre'), { target: { value: 'half_day' } })
    fireEvent.change(screen.getByLabelText('Inicio del cierre'), { target: { value: '13:00' } })
    fireEvent.change(screen.getByLabelText('Fin del cierre'), { target: { value: '17:00' } })
    fireEvent.change(screen.getByLabelText('Motivo (opcional)'), { target: { value: 'Capacitacion' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cierre' }))

    await waitFor(() => {
      expect(mockSaveBusinessClosure).toHaveBeenCalledWith({
        id: undefined,
        closureDate: '2026-05-20',
        closureType: 'half_day',
        startsAt: '13:00',
        endsAt: '17:00',
        reason: 'Capacitacion',
      })
      expect(screen.getByText('Cierre excepcional guardado correctamente.')).toBeDefined()
    })
  })

  it('does not have a Redes tab anymore (social links live in Página pública)', async () => {
    renderBusinessSettingsPage()
    await screen.findByDisplayValue('Salon Centro')
    expect(screen.queryByRole('button', { name: /Redes/ })).toBeNull()
  })

  describe('General tab (business rules only)', () => {
    it('no longer has logo, color or booking text fields (they live in Apariencia)', async () => {
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')

      expect(screen.queryByLabelText('Logo')).toBeNull()
      expect(screen.queryByText('Color principal (hex)')).toBeNull()
      expect(screen.queryByText('Textos de reserva')).toBeNull()
    })

    it('saving does not send branding fields, so it cannot overwrite them (edge case)', async () => {
      mockSaveBusinessSettings.mockResolvedValue(createSettingsResponse())
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')

      fireEvent.click(screen.getByRole('button', { name: 'Guardar configuracion del negocio' }))
      await waitFor(() => expect(mockSaveBusinessSettings).toHaveBeenCalled())

      const payload = mockSaveBusinessSettings.mock.calls[0][0]
      expect(payload).not.toHaveProperty('logoUrl')
      expect(payload).not.toHaveProperty('primaryColor')
      expect(payload).not.toHaveProperty('bookingHeaderText')
      expect(payload).not.toHaveProperty('bookingSubtitleText')
    })
  })

  describe('Notification settings (Política tab)', () => {
    async function openPolicyTab() {
      const tab = await screen.findByRole('button', { name: /Política/ })
      fireEvent.click(tab)
    }

    it('shows the stored notification email', async () => {
      mockGetBusinessSettings.mockResolvedValue(
        createSettingsResponse({ notificationEmail: 'inbox@negocio.com' }),
      )
      renderBusinessSettingsPage()
      await openPolicyTab()

      const input = await screen.findByLabelText('Email para notificaciones del negocio')
      expect((input as HTMLInputElement).value).toBe('inbox@negocio.com')
    })

    it('renders empty when no notification email is configured (edge case)', async () => {
      renderBusinessSettingsPage()
      await openPolicyTab()

      const input = await screen.findByLabelText('Email para notificaciones del negocio')
      expect((input as HTMLInputElement).value).toBe('')
    })

    it('is not part of the Identidad form anymore', async () => {
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')

      const identityForm = screen.getByLabelText('Nombre del negocio').closest('form')!
      expect(identityForm.contains(screen.getByLabelText('Email para notificaciones del negocio'))).toBe(false)
    })

    it('saves notification email and toggle together with the policy', async () => {
      mockUpdateBookingPolicy.mockResolvedValue(undefined)
      mockSaveNotificationSettings.mockResolvedValue(undefined)
      renderBusinessSettingsPage()
      await openPolicyTab()

      const toggle = (await screen.findByLabelText(/Enviar notificaciones por email/)) as HTMLInputElement
      expect(toggle.checked).toBe(true)
      fireEvent.click(toggle)
      fireEvent.change(screen.getByLabelText('Email para notificaciones del negocio'), {
        target: { value: 'nuevo@negocio.com' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar política' }))

      await waitFor(() => {
        expect(mockSaveNotificationSettings).toHaveBeenCalledWith({
          notificationEmail: 'nuevo@negocio.com',
          notificationsEnabled: false,
        })
      })
    })

    it('reflects notifications disabled from the stored settings (edge case)', async () => {
      mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ notificationsEnabled: false }))
      renderBusinessSettingsPage()
      await openPolicyTab()

      const toggle = (await screen.findByLabelText(/Enviar notificaciones por email/)) as HTMLInputElement
      expect(toggle.checked).toBe(false)
    })

    it('can be cleared: saves an empty notification email (edge case)', async () => {
      mockGetBusinessSettings.mockResolvedValue(
        createSettingsResponse({ notificationEmail: 'inbox@negocio.com' }),
      )
      mockUpdateBookingPolicy.mockResolvedValue(undefined)
      mockSaveNotificationSettings.mockResolvedValue(undefined)
      renderBusinessSettingsPage()
      await openPolicyTab()

      fireEvent.change(await screen.findByLabelText('Email para notificaciones del negocio'), {
        target: { value: '' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar política' }))

      await waitFor(() => {
        expect(mockSaveNotificationSettings).toHaveBeenCalledWith(
          expect.objectContaining({ notificationEmail: '' }),
        )
      })
    })

    it('rejects an invalid email without saving anything (edge case)', async () => {
      renderBusinessSettingsPage()
      await openPolicyTab()

      const input = await screen.findByLabelText('Email para notificaciones del negocio')
      fireEvent.change(input, { target: { value: 'no-es-un-email' } })
      fireEvent.submit(input.closest('form')!)

      expect(await screen.findByText('Ingresá un email válido para las notificaciones.')).toBeDefined()
      expect(mockUpdateBookingPolicy).not.toHaveBeenCalled()
      expect(mockSaveNotificationSettings).not.toHaveBeenCalled()
    })
  })

  describe('Configuración de reservas section', () => {
    it('renders with current booking policy values', async () => {
      mockGetBusinessSettings.mockResolvedValue(
        createSettingsResponse({ bookingMinNoticeMinutes: 120, bookingMaxHorizonDays: 90 }),
      )
      renderBusinessSettingsPage()

      await waitFor(() => {
        expect(screen.getByText('Configuración de reservas')).toBeDefined()
        expect(screen.getByLabelText('Anticipación mínima (minutos)')).toBeDefined()
        expect(screen.getByLabelText('Horizonte de reservas (días)')).toBeDefined()
      })

      const noticeInput = screen.getByLabelText('Anticipación mínima (minutos)') as HTMLInputElement
      const horizonInput = screen.getByLabelText('Horizonte de reservas (días)') as HTMLInputElement
      expect(noticeInput.value).toBe('120')
      expect(horizonInput.value).toBe('90')
    })

    it('shows validation error when notice is above max', async () => {
      renderBusinessSettingsPage()

      await waitFor(() => {
        expect(screen.getByLabelText('Anticipación mínima (minutos)')).toBeDefined()
      })

      const noticeInput = screen.getByLabelText('Anticipación mínima (minutos)')
      fireEvent.change(noticeInput, { target: { value: '10081' } })
      fireEvent.submit(noticeInput.closest('form')!)

      await waitFor(() => {
        expect(
          screen.getByText('La anticipación mínima debe estar entre 0 y 10080 minutos.'),
        ).toBeDefined()
      })
    })

    it('shows validation error when horizon is 0', async () => {
      renderBusinessSettingsPage()

      await waitFor(() => {
        expect(screen.getByLabelText('Horizonte de reservas (días)')).toBeDefined()
      })

      const horizonInput = screen.getByLabelText('Horizonte de reservas (días)')
      fireEvent.change(horizonInput, { target: { value: '0' } })
      fireEvent.submit(horizonInput.closest('form')!)

      await waitFor(() => {
        expect(
          screen.getByText('El horizonte de reservas debe estar entre 1 y 365 días.'),
        ).toBeDefined()
      })
    })

    it('calls updateBookingPolicy and shows success message on valid save', async () => {
      mockUpdateBookingPolicy.mockResolvedValue(undefined)
      renderBusinessSettingsPage()

      await waitFor(() => {
        expect(screen.getByLabelText('Anticipación mínima (minutos)')).toBeDefined()
      })

      fireEvent.change(screen.getByLabelText('Anticipación mínima (minutos)'), {
        target: { value: '30' },
      })
      fireEvent.change(screen.getByLabelText('Horizonte de reservas (días)'), {
        target: { value: '90' },
      })
      fireEvent.submit(screen.getByLabelText('Horizonte de reservas (días)').closest('form')!)

      await waitFor(() => {
        expect(mockUpdateBookingPolicy).toHaveBeenCalledWith(30, 90)
        expect(screen.getByText('Política de reservas actualizada.')).toBeDefined()
      })
    })
  })
})