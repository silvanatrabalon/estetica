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
const mockSetSplitShifts = vi.fn()

vi.mock('../services/businessSettings', () => ({
  getBusinessSettings: (...args: unknown[]) => mockGetBusinessSettings(...args),
  saveBusinessSettings: (...args: unknown[]) => mockSaveBusinessSettings(...args),
  saveNotificationSettings: (...args: unknown[]) => mockSaveNotificationSettings(...args),
  saveBusinessClosure: (...args: unknown[]) => mockSaveBusinessClosure(...args),
  deleteBusinessClosure: (...args: unknown[]) => mockDeleteBusinessClosure(...args),
  updateBookingPolicy: (...args: unknown[]) => mockUpdateBookingPolicy(...args),
  setSplitShifts: (...args: unknown[]) => mockSetSplitShifts(...args),
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
    splitShifts: false,
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
      expect(screen.getByText(/Configuración incompleta/)).toBeDefined()
    })
  })

  it('saves business identity and weekly hours', async () => {
    mockSaveBusinessSettings.mockResolvedValue(createSettingsResponse())

    renderBusinessSettingsPage()

    await waitFor(() => {
      expect(screen.getByDisplayValue('Salon Centro')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Salon Norte' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar datos del negocio' }))

    await waitFor(() => {
      expect(mockSaveBusinessSettings).toHaveBeenCalled()
      expect(screen.getByText('Datos del negocio guardados.')).toBeDefined()
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
    fireEvent.change(screen.getByLabelText('Cierra desde'), { target: { value: '13:00' } })
    fireEvent.change(screen.getByLabelText('Reabre a las'), { target: { value: '17:00' } })
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
    expect(screen.queryByRole('tab', { name: /Redes/ })).toBeNull()
  })

  describe('Tabs', () => {
    it('are exposed as a tablist with the active one selected', async () => {
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')

      expect(screen.getByRole('tablist', { name: 'Secciones de Negocio' })).toBeDefined()
      const tabs = screen.getAllByRole('tab')
      expect(tabs.map((t) => t.textContent)).toEqual(['General', 'Horarios', 'Cierres', 'Política', 'Historial'])
      expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false', 'false', 'false'])
    })

    it('moves the selection when another tab is pressed', async () => {
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')

      fireEvent.click(screen.getByRole('tab', { name: 'Horarios' }))

      expect(screen.getByRole('tab', { name: 'Horarios' }).getAttribute('aria-selected')).toBe('true')
      expect(screen.getByRole('tab', { name: 'General' }).getAttribute('aria-selected')).toBe('false')
    })
  })

  describe('Horarios rows (phone layout)', () => {
    async function openHours() {
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')
      fireEvent.click(screen.getByRole('tab', { name: 'Horarios' }))
    }

    it('every open day has labelled opening and closing time fields', async () => {
      await openHours()

      const open = screen.getByLabelText('Lunes: hora de inicio') as HTMLInputElement
      const close = screen.getByLabelText('Lunes: hora de fin') as HTMLInputElement
      expect(open.value).toBe('09:00')
      expect(close.value).toBe('18:00')
      expect(screen.getAllByLabelText(/hora de inicio/)).toHaveLength(5)
    })

    it('shows the visible "Desde" and "Hasta" captions for phones', async () => {
      await openHours()
      expect(screen.getAllByText('Desde').length).toBe(5)
      expect(screen.getAllByText('Hasta').length).toBe(5)
    })

    it('a closed day shows "Cerrado" and no time fields (edge case)', async () => {
      await openHours()

      expect(screen.getAllByText('Cerrado').length).toBeGreaterThanOrEqual(2)
      expect(screen.queryByLabelText('Sábado: hora de inicio')).toBeNull()
      expect(screen.queryByLabelText('Domingo: hora de inicio')).toBeNull()
    })

    it('each day switch has an accessible name and reflects its state', async () => {
      await openHours()

      const monday = screen.getByRole('switch', { name: 'Lunes: abierto' })
      expect(monday.getAttribute('aria-checked')).toBe('true')
      expect(screen.getByRole('switch', { name: 'Sábado: abierto' }).getAttribute('aria-checked')).toBe('false')
      expect(screen.getAllByRole('switch')).toHaveLength(7)
    })

    it('opening a closed day reveals its time fields (edge case)', async () => {
      await openHours()

      fireEvent.click(screen.getByRole('switch', { name: 'Sábado: abierto' }))

      expect(await screen.findByLabelText('Sábado: hora de inicio')).toBeDefined()
      expect(screen.getByLabelText('Sábado: hora de fin')).toBeDefined()
    })

    it('editing a time updates the value that will be saved', async () => {
      mockSaveBusinessSettings.mockResolvedValue(createSettingsResponse())
      await openHours()

      fireEvent.change(screen.getByLabelText('Lunes: hora de inicio'), { target: { value: '08:30' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }))

      await waitFor(() => expect(mockSaveBusinessSettings).toHaveBeenCalled())
      const monday = mockSaveBusinessSettings.mock.calls[0][0].weeklyHours.find((h: { dayOfWeek: number }) => h.dayOfWeek === 1)
      expect(monday.opensAt).toBe('08:30')
    })
  })

  describe('Saving without surprises', () => {
    const saved = (overrides = {}) => createSettingsResponse(overrides)

    it('saving Horarios does not save an unsaved name edit (edge case)', async () => {
      mockSaveBusinessSettings.mockResolvedValue(saved())
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')

      fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Nombre a medio editar' } })
      fireEvent.click(screen.getByRole('tab', { name: /Horarios/ }))
      fireEvent.change(screen.getByLabelText('Lunes: hora de inicio'), { target: { value: '08:30' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }))

      await waitFor(() => expect(mockSaveBusinessSettings).toHaveBeenCalled())
      const payload = mockSaveBusinessSettings.mock.calls[0][0]
      expect(payload.name).toBe('Salon Centro')
      expect(payload.weeklyHours.find((h: { dayOfWeek: number }) => h.dayOfWeek === 1).opensAt).toBe('08:30')
    })

    it('saving General does not save unsaved hour edits, and keeps them on screen (edge case)', async () => {
      mockSaveBusinessSettings.mockResolvedValue(saved({ name: 'Salon Norte' }))
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')

      fireEvent.click(screen.getByRole('tab', { name: /Horarios/ }))
      fireEvent.change(screen.getByLabelText('Lunes: hora de inicio'), { target: { value: '08:30' } })
      fireEvent.click(screen.getByRole('tab', { name: /General/ }))
      fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Salon Norte' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar datos del negocio' }))

      await waitFor(() => expect(mockSaveBusinessSettings).toHaveBeenCalled())
      const payload = mockSaveBusinessSettings.mock.calls[0][0]
      expect(payload.name).toBe('Salon Norte')
      expect(payload.weeklyHours.find((h: { dayOfWeek: number }) => h.dayOfWeek === 1).opensAt).toBe('09:00')
      expect((screen.getByLabelText('Lunes: hora de inicio') as HTMLInputElement).value).toBe('08:30')
    })

    it('shows "Hay cambios sin guardar" and marks the tab, then clears both after saving', async () => {
      mockSaveBusinessSettings.mockResolvedValue(saved({ name: 'Salon Norte' }))
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')
      expect(screen.queryByText('Hay cambios sin guardar')).toBeNull()

      fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Salon Norte' } })
      expect(screen.getByText('Hay cambios sin guardar')).toBeDefined()
      expect(screen.getByRole('tab', { name: /General.*con cambios sin guardar/ })).toBeDefined()

      fireEvent.click(screen.getByRole('button', { name: 'Guardar datos del negocio' }))
      await waitFor(() => expect(screen.queryByText('Hay cambios sin guardar')).toBeNull())
      expect(screen.getByRole('tab', { name: 'General' })).toBeDefined()
    })

    it('editing back to the stored value clears the unsaved cue (edge case)', async () => {
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')

      fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Otro' } })
      expect(screen.getByText('Hay cambios sin guardar')).toBeDefined()
      fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Salon Centro' } })
      expect(screen.queryByText('Hay cambios sin guardar')).toBeNull()
    })

    it('marks the Política tab when its fields change', async () => {
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')

      fireEvent.click(screen.getByRole('tab', { name: /Política/ }))
      fireEvent.change(await screen.findByLabelText('Anticipación mínima para reservar'), { target: { value: '120' } })

      expect(screen.getByRole('tab', { name: /Política.*con cambios sin guardar/ })).toBeDefined()
    })

    it('shows a failed save as an alert that stays until closed (edge case)', async () => {
      mockSaveBusinessSettings.mockRejectedValue(new Error('El nombre del negocio debe tener al menos 2 caracteres.'))
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')

      fireEvent.click(screen.getByRole('button', { name: 'Guardar datos del negocio' }))

      expect((await screen.findByRole('alert')).textContent).toContain('al menos 2 caracteres')
      fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
      expect(screen.queryByRole('alert')).toBeNull()
    })

    it('announces a successful save as a status message', async () => {
      mockSaveBusinessSettings.mockResolvedValue(saved())
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')
      fireEvent.click(screen.getByRole('tab', { name: /Horarios/ }))

      fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }))

      expect((await screen.findByRole('status')).textContent).toContain('Horarios guardados.')
    })
  })

  describe('Cierres accessibility', () => {
    const closure = {
      id: 'c1',
      closureDate: '2026-12-24',
      closureType: 'full_day',
      startsAt: null,
      endsAt: null,
      reason: 'Navidad',
    }

    async function openClosures() {
      mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ closures: [closure] }))
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')
      fireEvent.click(screen.getByRole('tab', { name: /Cierres/ }))
    }

    it('each closure has Editar and Eliminar buttons that say which closure they act on', async () => {
      await openClosures()

      expect(screen.getByRole('button', { name: /Editar cierre del Jueves 24 de diciembre/ })).toBeDefined()
      expect(screen.getByRole('button', { name: /Eliminar cierre del Jueves 24 de diciembre/ })).toBeDefined()
    })

    it('Editar loads the closure into the form', async () => {
      await openClosures()

      fireEvent.click(screen.getByRole('button', { name: /Editar cierre del Jueves 24 de diciembre/ }))

      expect(screen.getByDisplayValue('Navidad')).toBeDefined()
      expect(screen.getByDisplayValue('2026-12-24')).toBeDefined()
      expect(screen.getByRole('button', { name: 'Actualizar cierre' })).toBeDefined()
    })

    it('with no closures it shows the empty message and no row buttons (edge case)', async () => {
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')
      fireEvent.click(screen.getByRole('tab', { name: /Cierres/ }))

      expect(screen.getByText('Todavía no cargaste ningún cierre excepcional.')).toBeDefined()
      expect(screen.queryByRole('button', { name: /Editar cierre del/ })).toBeNull()
    })
  })

  describe('Notification toggle target', () => {
    it('the whole row is one label, so the label text toggles the checkbox', async () => {
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')
      fireEvent.click(screen.getByRole('tab', { name: /Política/ }))

      const checkbox = (await screen.findByLabelText(/Enviar notificaciones por email/)) as HTMLInputElement
      expect(checkbox.checked).toBe(true)
      fireEvent.click(screen.getByText('Enviar notificaciones por email'))
      expect(checkbox.checked).toBe(false)
    })
  })

  describe('Plain-language closures and copy', () => {
    const closures = [
      { id: 'c1', closureDate: '2026-12-24', closureType: 'full_day', startsAt: null, endsAt: null, reason: 'Navidad' },
      { id: 'c2', closureDate: '2025-05-19', closureType: 'half_day', startsAt: '19:00:00', endsAt: '21:00:00', reason: null },
    ]

    async function openClosures() {
      mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ closures }))
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')
      fireEvent.click(screen.getByRole('tab', { name: /Cierres/ }))
    }

    it('shows dates as weekday, day and month in Spanish, not as ISO', async () => {
      await openClosures()

      expect(screen.getByText('Jueves 24 de diciembre')).toBeDefined()
      expect(screen.getByText('Lunes 19 de mayo de 2025')).toBeDefined()
      expect(screen.queryByText('2026-12-24')).toBeNull()
    })

    it('shows half-day times without seconds and full days in words', async () => {
      await openClosures()

      expect(screen.getByText(/Todo el día · Navidad/)).toBeDefined()
      expect(screen.getByText('Media jornada: de 19:00 a 21:00')).toBeDefined()
    })

    it('explains that a closure overrides the weekly hours', async () => {
      await openClosures()
      expect(screen.getByText(/Un cierre tiene prioridad sobre tus horarios de la semana/)).toBeDefined()
    })

    it('day names carry their accents', async () => {
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')
      fireEvent.click(screen.getByRole('tab', { name: /Horarios/ }))

      expect(screen.getByRole('switch', { name: 'Sábado: abierto' })).toBeDefined()
      expect(screen.getByRole('switch', { name: 'Miércoles: abierto' })).toBeDefined()
    })

    it('speaks to the owner with "vos" in the header and save button', async () => {
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')

      expect(screen.getByText(/Configurá los datos, los horarios y las reglas de reserva de tu salón/)).toBeDefined()
      expect(screen.getByRole('button', { name: 'Guardar datos del negocio' })).toBeDefined()
    })

    it('a closure with an unparseable date still renders its raw value (edge case)', async () => {
      mockGetBusinessSettings.mockResolvedValue(
        createSettingsResponse({
          closures: [{ id: 'c3', closureDate: 'fecha-rota', closureType: 'full_day', startsAt: null, endsAt: null, reason: null }],
        }),
      )
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')
      fireEvent.click(screen.getByRole('tab', { name: /Cierres/ }))

      expect(screen.getByText('fecha-rota')).toBeDefined()
    })
  })

  describe('Closures do not discard other unsaved edits', () => {
    const closure = {
      id: 'c1',
      closureDate: '2099-12-24',
      closureType: 'full_day',
      startsAt: null,
      endsAt: null,
      reason: 'Navidad',
    }

    it('deleting a closure keeps an unsaved name edit (edge case)', async () => {
      mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ closures: [closure] }))
      mockDeleteBusinessClosure.mockResolvedValue(undefined)
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')

      fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value: 'Nombre a medio editar' } })
      fireEvent.click(screen.getByRole('tab', { name: /Cierres/ }))
      mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ closures: [] }))
      fireEvent.click(screen.getByRole('button', { name: /Eliminar cierre del/ }))
      fireEvent.click(await screen.findByRole('button', { name: 'Eliminar cierre' }))

      await waitFor(() => expect(mockDeleteBusinessClosure).toHaveBeenCalledWith('c1'))
      expect(await screen.findByText('Todavía no cargaste ningún cierre excepcional.')).toBeDefined()
      expect((screen.getByLabelText('Nombre del negocio') as HTMLInputElement).value).toBe('Nombre a medio editar')
    })

    it('saving a closure keeps unsaved hour edits (edge case)', async () => {
      mockSaveBusinessClosure.mockResolvedValue(undefined)
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')

      fireEvent.click(screen.getByRole('tab', { name: /Horarios/ }))
      fireEvent.change(screen.getByLabelText('Lunes: hora de inicio'), { target: { value: '08:30' } })
      fireEvent.click(screen.getByRole('tab', { name: /Cierres/ }))
      mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ closures: [closure] }))
      fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2099-12-24' } })
      fireEvent.click(screen.getByRole('button', { name: 'Guardar cierre' }))

      await waitFor(() => expect(mockSaveBusinessClosure).toHaveBeenCalled())
      expect(await screen.findByText('Jueves 24 de diciembre de 2099')).toBeDefined()
      fireEvent.click(screen.getByRole('tab', { name: /Horarios/ }))
      expect((screen.getByLabelText('Lunes: hora de inicio') as HTMLInputElement).value).toBe('08:30')
    })

    it('the delete confirmation is destructive and names the action', async () => {
      mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ closures: [closure] }))
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')
      fireEvent.click(screen.getByRole('tab', { name: /Cierres/ }))

      fireEvent.click(screen.getByRole('button', { name: /Eliminar cierre del/ }))

      const confirm = await screen.findByRole('button', { name: 'Eliminar cierre' })
      expect(confirm.className).toContain('bg-red-600')
    })

    it('cancelling the delete confirmation changes nothing (edge case)', async () => {
      mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ closures: [closure] }))
      renderBusinessSettingsPage()
      await screen.findByDisplayValue('Salon Centro')
      fireEvent.click(screen.getByRole('tab', { name: /Cierres/ }))

      fireEvent.click(screen.getByRole('button', { name: /Eliminar cierre del/ }))
      fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))

      expect(mockDeleteBusinessClosure).not.toHaveBeenCalled()
      expect(screen.getByText('Jueves 24 de diciembre de 2099')).toBeDefined()
    })
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

      fireEvent.click(screen.getByRole('button', { name: 'Guardar datos del negocio' }))
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
      const tab = await screen.findByRole('tab', { name: /Política/ })
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
        expect(screen.getByLabelText('Anticipación mínima para reservar')).toBeDefined()
        expect(screen.getByLabelText('Cuántos días hacia adelante se puede reservar')).toBeDefined()
      })

      const noticeInput = screen.getByLabelText('Anticipación mínima para reservar') as HTMLSelectElement
      const horizonInput = screen.getByLabelText('Cuántos días hacia adelante se puede reservar') as HTMLInputElement
      expect(noticeInput.value).toBe('120')
      expect(screen.getByRole('option', { name: '2 horas' })).toBeDefined()
      expect(horizonInput.value).toBe('90')
    })

    it('offers the notice in plain words instead of raw minutes', async () => {
      renderBusinessSettingsPage()
      const select = (await screen.findByLabelText('Anticipación mínima para reservar')) as HTMLSelectElement

      const labels = Array.from(select.options).map((o) => o.textContent)
      expect(labels).toEqual(
        expect.arrayContaining(['Sin anticipación', '30 minutos', '1 hora', '1 día', '1 semana']),
      )
      expect(select.value).toBe('60')
    })

    it('keeps a stored custom notice selectable, shown in words (edge case)', async () => {
      mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ bookingMinNoticeMinutes: 90 }))
      renderBusinessSettingsPage()

      const select = (await screen.findByLabelText('Anticipación mínima para reservar')) as HTMLSelectElement
      expect(select.value).toBe('90')
      expect(screen.getByRole('option', { name: '90 minutos' })).toBeDefined()
    })

    it('still rejects a stored notice above the maximum when saving (edge case)', async () => {
      mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ bookingMinNoticeMinutes: 20000 }))
      renderBusinessSettingsPage()

      const select = await screen.findByLabelText('Anticipación mínima para reservar')
      fireEvent.submit(select.closest('form')!)

      expect(
        await screen.findByText('La anticipación mínima debe estar entre 0 y 10080 minutos.'),
      ).toBeDefined()
      expect(mockUpdateBookingPolicy).not.toHaveBeenCalled()
    })

    it('shows validation error when horizon is 0', async () => {
      renderBusinessSettingsPage()

      await waitFor(() => {
        expect(screen.getByLabelText('Cuántos días hacia adelante se puede reservar')).toBeDefined()
      })

      const horizonInput = screen.getByLabelText('Cuántos días hacia adelante se puede reservar')
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
        expect(screen.getByLabelText('Anticipación mínima para reservar')).toBeDefined()
      })

      fireEvent.change(screen.getByLabelText('Anticipación mínima para reservar'), {
        target: { value: '30' },
      })
      fireEvent.change(screen.getByLabelText('Cuántos días hacia adelante se puede reservar'), {
        target: { value: '90' },
      })
      fireEvent.submit(screen.getByLabelText('Cuántos días hacia adelante se puede reservar').closest('form')!)

      await waitFor(() => {
        expect(mockUpdateBookingPolicy).toHaveBeenCalledWith(30, 90)
        expect(screen.getByText('Política de reservas actualizada.')).toBeDefined()
      })
    })
  })
})

describe('BusinessSettingsPage — jornada corrida o dos turnos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBusinessSettings.mockResolvedValue(createSettingsResponse())
    mockSetSplitShifts.mockResolvedValue(undefined)
  })

  async function openHours() {
    renderBusinessSettingsPage()
    fireEvent.click(await screen.findByRole('tab', { name: /Horarios/ }))
  }

  it('starts on "Jornada corrida" with a single range per day', async () => {
    await openHours()
    expect(screen.getByRole('radio', { name: 'Jornada corrida' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.queryByLabelText('Lunes: Turno matutino')).toBeNull()
    expect(screen.getByLabelText('Lunes: hora de inicio')).toBeDefined()
  })

  it('switching to "Dos turnos" saves the mode and shows matutino/vespertino', async () => {
    await openHours()
    mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ splitShifts: true }))
    fireEvent.click(screen.getByRole('radio', { name: 'Dos turnos' }))

    await waitFor(() => expect(mockSetSplitShifts).toHaveBeenCalledWith(true))
    expect(await screen.findAllByLabelText('Lunes: Turno matutino')).toHaveLength(1)
    expect(screen.getByLabelText('Lunes: Turno vespertino')).toBeDefined()
  })

  it('switching back to corrida asks for confirmation first and does nothing if cancelled (edge case)', async () => {
    mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ splitShifts: true }))
    await openHours()
    fireEvent.click(screen.getByRole('radio', { name: 'Jornada corrida' }))

    expect(mockSetSplitShifts).not.toHaveBeenCalled()
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))
    expect(mockSetSplitShifts).not.toHaveBeenCalled()
  })

  it('confirming the switch to corrida calls the service with false', async () => {
    mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ splitShifts: true }))
    await openHours()
    fireEvent.click(screen.getByRole('radio', { name: 'Jornada corrida' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Sí, pasar a corrida' }))
    await waitFor(() => expect(mockSetSplitShifts).toHaveBeenCalledWith(false))
  })

  it('a day with only the vespertino shift is valid and is saved without morning times', async () => {
    mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ splitShifts: true }))
    mockSaveBusinessSettings.mockResolvedValue(createSettingsResponse({ splitShifts: true }))
    await openHours()
    fireEvent.click(screen.getByLabelText('Lunes: Turno matutino')) // off
    fireEvent.click(screen.getByLabelText('Lunes: Turno vespertino')) // on
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }))

    await waitFor(() => expect(mockSaveBusinessSettings).toHaveBeenCalled())
    const monday = mockSaveBusinessSettings.mock.calls[0][0].weeklyHours.find(
      (h: { dayOfWeek: number }) => h.dayOfWeek === 1,
    )
    expect(monday.opensAt).toBeNull()
    expect(monday.pmOpensAt).toBe('15:00')
  })

  it('a day with both shifts turned off cannot be saved (edge case)', async () => {
    mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ splitShifts: true }))
    await openHours()
    fireEvent.click(screen.getByLabelText('Lunes: Turno matutino'))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }))

    expect(await screen.findByText('Elegí al menos un turno.')).toBeDefined()
    expect(mockSaveBusinessSettings).not.toHaveBeenCalled()
  })
})

describe('BusinessSettingsPage — look', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBusinessSettings.mockResolvedValue(createSettingsResponse())
  })

  it('does not repeat a "Datos del negocio" title inside the General tab', async () => {
    renderBusinessSettingsPage()
    await screen.findByDisplayValue('Salon Centro')
    expect(screen.queryByText('Datos del negocio')).toBeNull()
  })

  it('save buttons say just "Guardar" (and keep their full accessible name)', async () => {
    renderBusinessSettingsPage()
    await screen.findByDisplayValue('Salon Centro')
    const save = screen.getByRole('button', { name: 'Guardar datos del negocio' })
    expect(save.textContent).toBe('Guardar')
    expect(screen.getByRole('button', { name: 'Guardar horarios' }).textContent).toBe('Guardar')
    expect(screen.getByRole('button', { name: 'Guardar política' }).textContent).toBe('Guardar')
  })

  it('the history (delete reservations) is a tab of the section menu, hidden until chosen (edge case)', async () => {
    renderBusinessSettingsPage()
    await screen.findByDisplayValue('Salon Centro')
    const tab = screen.getByRole('tab', { name: 'Historial' })
    expect(tab).toHaveAttribute('aria-selected', 'false')
    const panel = screen.getByText('Eliminar historial de reservas').closest('div[class*="hidden"]')
    expect(panel).not.toBeNull()
    fireEvent.click(tab)
    expect(tab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Eliminar historial de reservas').closest('div[class*="hidden"]')).toBeNull()
    expect(screen.queryByText('Zona de peligro')).toBeNull() // the old name is gone
  })

  it('the history tab never shows the unsaved-changes dot (edge case)', async () => {
    renderBusinessSettingsPage()
    await screen.findByDisplayValue('Salon Centro')
    expect(screen.getByRole('tab', { name: 'Historial' }).textContent).not.toContain('sin guardar')
  })
})

describe('BusinessSettingsPage — tabs layout', () => {
  it('every tab is a single word and shares the width, so none wraps or is cut (edge case)', async () => {
    renderBusinessSettingsPage()
    await screen.findByDisplayValue('Salon Centro')
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.textContent).not.toMatch(/\s/)
      expect(tab.className).toContain('flex-1')
      expect(tab.className).toContain('min-w-0')
      expect(tab.className).toContain('whitespace-nowrap')
      expect(tab.className).not.toContain('shrink-0')
    }
  })

  it('every tab has its icon, shown above the label on phones and beside it on larger screens', async () => {
    renderBusinessSettingsPage()
    await screen.findByDisplayValue('Salon Centro')
    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.querySelector('svg')).not.toBeNull()
      expect(tab.className).toContain('flex-col')
      expect(tab.className).toContain('sm:flex-row')
    }
  })
})

describe('BusinessSettingsPage — unsaved changes are never saved on their own', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBusinessSettings.mockResolvedValue(createSettingsResponse())
    mockSetSplitShifts.mockResolvedValue(undefined)
  })

  async function open() {
    renderBusinessSettingsPage()
    await screen.findByDisplayValue('Salon Centro')
  }
  const editName = (value: string) =>
    fireEvent.change(screen.getByLabelText('Nombre del negocio'), { target: { value } })

  it('leaving a section with unsaved changes asks first, and "Volver y guardar" stays on it', async () => {
    await open()
    editName('Salon Norte')
    fireEvent.click(screen.getByRole('tab', { name: /Horarios/ }))

    expect(await screen.findByText('Tenés cambios sin guardar en General')).toBeInTheDocument()
    expect(screen.getByText(/no se guardan solos/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Volver y guardar' }))
    expect(screen.getByRole('tab', { name: /General/ })).toHaveAttribute('aria-selected', 'true')
    expect((screen.getByLabelText('Nombre del negocio') as HTMLInputElement).value).toBe('Salon Norte')
    expect(mockSaveBusinessSettings).not.toHaveBeenCalled()
  })

  it('"Salir sin guardar" goes on and drops the edits, without saving anything', async () => {
    await open()
    editName('Salon Norte')
    fireEvent.click(screen.getByRole('tab', { name: /Horarios/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Salir sin guardar' }))

    expect(screen.getByRole('tab', { name: 'Horarios' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'General' }))
    expect((screen.getByLabelText('Nombre del negocio') as HTMLInputElement).value).toBe('Salon Centro')
    expect(screen.queryByText('Hay cambios sin guardar')).toBeNull()
    expect(mockSaveBusinessSettings).not.toHaveBeenCalled()
  })

  it('changing tab without edits does not ask anything (edge case)', async () => {
    await open()
    fireEvent.click(screen.getByRole('tab', { name: 'Horarios' }))
    expect(screen.queryByText(/Tenés cambios sin guardar en/)).toBeNull()
    expect(screen.getByRole('tab', { name: 'Horarios' })).toHaveAttribute('aria-selected', 'true')
  })

  it('pressing the tab you are already on does not ask anything (edge case)', async () => {
    await open()
    editName('Salon Norte')
    fireEvent.click(screen.getByRole('tab', { name: /General/ }))
    expect(screen.queryByText(/Tenés cambios sin guardar en/)).toBeNull()
  })

  it('the same goes for Horarios and Política', async () => {
    await open()
    fireEvent.click(screen.getByRole('tab', { name: 'Horarios' }))
    fireEvent.change(screen.getByLabelText('Lunes: hora de inicio'), { target: { value: '08:30' } })
    fireEvent.click(screen.getByRole('tab', { name: 'Cierres' }))
    expect(await screen.findByText('Tenés cambios sin guardar en Horarios')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Volver y guardar' }))

    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }))
    await waitFor(() => expect(mockSaveBusinessSettings).toHaveBeenCalled())
  })

  it('Horarios shows a visible notice while it has unsaved changes, and it goes away when they are undone', async () => {
    await open()
    fireEvent.click(screen.getByRole('tab', { name: 'Horarios' }))
    expect(screen.queryByText(/no se guardan solos/)).toBeNull()
    const start = screen.getByLabelText('Lunes: hora de inicio') as HTMLInputElement
    const original = start.value
    fireEvent.change(start, { target: { value: '08:30' } })
    expect(screen.getByRole('status')).toHaveTextContent(/Apretá Guardar abajo antes de salir de esta sección/)
    fireEvent.change(start, { target: { value: original } })
    expect(screen.queryByText(/no se guardan solos/)).toBeNull()
  })

  it('changing the work mode with unsaved hours warns that they would be lost (edge case)', async () => {
    await open()
    fireEvent.click(screen.getByRole('tab', { name: 'Horarios' }))
    fireEvent.change(screen.getByLabelText('Lunes: hora de inicio'), { target: { value: '08:30' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Dos turnos' }))

    expect(await screen.findByText('Tenés horarios sin guardar')).toBeInTheDocument()
    expect(mockSetSplitShifts).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Volver y guardar' }))
    expect(mockSetSplitShifts).not.toHaveBeenCalled()
    expect((screen.getByLabelText('Lunes: hora de inicio') as HTMLInputElement).value).toBe('08:30')
  })

  it('"Cambiar y descartar" drops the hour edits and then does change the mode', async () => {
    await open()
    mockGetBusinessSettings.mockResolvedValue(createSettingsResponse({ splitShifts: true }))
    fireEvent.click(screen.getByRole('tab', { name: 'Horarios' }))
    fireEvent.change(screen.getByLabelText('Lunes: hora de inicio'), { target: { value: '08:30' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Dos turnos' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cambiar y descartar' }))
    await waitFor(() => expect(mockSetSplitShifts).toHaveBeenCalledWith(true))
    expect(mockSaveBusinessSettings).not.toHaveBeenCalled()
  })

  it('changing the mode with everything saved needs no warning (edge case)', async () => {
    await open()
    fireEvent.click(screen.getByRole('tab', { name: 'Horarios' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Dos turnos' }))
    await waitFor(() => expect(mockSetSplitShifts).toHaveBeenCalledWith(true))
    expect(screen.queryByText('Tenés horarios sin guardar')).toBeNull()
  })

  it('the browser warns before closing the page only while there are unsaved changes (edge case)', async () => {
    await open()
    const clean = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(clean)
    expect(clean.defaultPrevented).toBe(false)

    editName('Salon Norte')
    const dirty = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(dirty)
    expect(dirty.defaultPrevented).toBe(true)

    editName('Salon Centro')
    const back = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(back)
    expect(back.defaultPrevented).toBe(false)
  })
})
