import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AdminGiftCardsPage } from './AdminGiftCardsPage'

const mockServices = vi.fn()
const mockSettings = vi.fn()
const mockPng = vi.fn()
const mockDownload = vi.fn()
const mockLoadLogo = vi.fn()

vi.mock('../services/adminServices', () => ({ listServices: (...a: unknown[]) => mockServices(...a) }))
vi.mock('../services/businessSettings', () => ({ getBusinessSettings: (...a: unknown[]) => mockSettings(...a) }))
vi.mock('../lib/couponImage', async () => {
  const actual = await vi.importActual<typeof import('../lib/couponImage')>('../lib/couponImage')
  return {
    ...actual,
    svgToPngBlob: (...a: unknown[]) => mockPng(...a),
    downloadBlob: (...a: unknown[]) => mockDownload(...a),
    loadImageAsDataUrl: (...a: unknown[]) => mockLoadLogo(...a),
  }
})

const svc = (id: string, name: string, isActive = true) => ({ id, name, isActive })
const preview = () => decodeURIComponent((screen.getByAltText('Vista previa de la gift card') as HTMLImageElement).src)

async function pickService(name: string) {
  await waitFor(() => expect(mockServices).toHaveBeenCalled())
  fireEvent.click(screen.getByLabelText('Servicio'))
  fireEvent.click(await screen.findByRole('option', { name }))
}

describe('AdminGiftCardsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServices.mockResolvedValue([svc('s1', 'Limpieza facial'), svc('s2', 'Masaje'), svc('s3', 'Viejo', false)])
    mockSettings.mockResolvedValue({ name: 'Estética So Beauty', logoUrl: 'https://x.test/logo.png' })
    mockLoadLogo.mockResolvedValue('data:image/png;base64,LOGO')
    mockPng.mockResolvedValue(new Blob(['png']))
  })

  it('has the form with for whom, from whom, service or amount, message, validity and style', async () => {
    render(<AdminGiftCardsPage />)
    expect(screen.getByRole('heading', { name: 'Gift Card' })).toBeInTheDocument()
    for (const label of ['Para', /De parte de/, /Mensaje/, /Válida hasta/]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(screen.getByRole('radio', { name: 'Un servicio' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Un monto' })).toBeInTheDocument()
    for (const style of ['Rosa', 'Dorado', 'Lila']) expect(screen.getByRole('radio', { name: style })).toBeInTheDocument()
    await waitFor(() => expect(mockServices).toHaveBeenCalled())
  })

  it('updates the preview as the data is typed, with the business name and logo', async () => {
    render(<AdminGiftCardsPage />)
    fireEvent.change(screen.getByLabelText('Para'), { target: { value: 'Ana Pérez' } })
    fireEvent.change(screen.getByLabelText(/De parte de/), { target: { value: 'Silvana' } })
    fireEvent.change(screen.getByLabelText(/Mensaje/), { target: { value: 'Feliz cumple' } })
    await pickService('Masaje')
    await waitFor(() => expect(preview()).toContain('Estética So Beauty'.toUpperCase()))
    await waitFor(() => expect(preview()).toContain('data:image/png;base64,LOGO'))
    for (const text of ['Ana Pérez', 'Silvana', 'Feliz cumple', 'Masaje', 'GIFT CARD']) expect(preview()).toContain(text)
  })

  it('only lists active services (edge case)', async () => {
    render(<AdminGiftCardsPage />)
    await waitFor(() => expect(mockServices).toHaveBeenCalled())
    fireEvent.click(screen.getByLabelText('Servicio'))
    expect(await screen.findByRole('option', { name: 'Limpieza facial' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Viejo' })).toBeNull()
  })

  it('switching to an amount shows it in pesos in the preview', async () => {
    render(<AdminGiftCardsPage />)
    fireEvent.click(screen.getByRole('radio', { name: 'Un monto' }))
    fireEvent.change(screen.getByLabelText('Monto ($)'), { target: { value: '15000' } })
    expect(preview()).toContain('$ 15.000')
  })

  it('a different style changes the preview', () => {
    render(<AdminGiftCardsPage />)
    const before = (screen.getByAltText('Vista previa de la gift card') as HTMLImageElement).src
    fireEvent.click(screen.getByRole('radio', { name: 'Lila' }))
    expect((screen.getByAltText('Vista previa de la gift card') as HTMLImageElement).src).not.toBe(before)
  })

  it('downloads the PNG named after the recipient', async () => {
    render(<AdminGiftCardsPage />)
    fireEvent.change(screen.getByLabelText('Para'), { target: { value: 'Ana María' } })
    await pickService('Masaje')
    fireEvent.click(screen.getByRole('button', { name: 'Descargar imagen' }))
    await waitFor(() => expect(mockDownload).toHaveBeenCalled())
    expect(mockDownload.mock.calls[0][1]).toBe('gift-card-ana-maria.png')
    expect(mockPng).toHaveBeenCalledWith(expect.stringContaining('GIFT CARD'), 1, 1600, 1000)
  })

  it('does not download without who it is for or without the service (edge cases)', async () => {
    render(<AdminGiftCardsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Descargar imagen' }))
    expect(await screen.findByText('Escribí para quién es la gift card.')).toBeInTheDocument()
    expect(screen.getByText('Elegí el servicio.')).toBeInTheDocument()
    expect(mockDownload).not.toHaveBeenCalled()
  })

  it('does not download an empty or zero amount (edge case)', async () => {
    render(<AdminGiftCardsPage />)
    fireEvent.change(screen.getByLabelText('Para'), { target: { value: 'Ana' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Un monto' }))
    fireEvent.click(screen.getByRole('button', { name: 'Descargar imagen' }))
    expect(await screen.findByText('Ingresá un monto mayor a cero.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Monto ($)'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Descargar imagen' }))
    expect(await screen.findByText('Ingresá un monto mayor a cero.')).toBeInTheDocument()
    expect(mockDownload).not.toHaveBeenCalled()
  })

  it('says so when the browser cannot make the image (edge case)', async () => {
    mockPng.mockRejectedValue(new Error('canvas-unavailable'))
    render(<AdminGiftCardsPage />)
    fireEvent.change(screen.getByLabelText('Para'), { target: { value: 'Ana' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Un monto' }))
    fireEvent.change(screen.getByLabelText('Monto ($)'), { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Descargar imagen' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos generar la imagen')
    expect(mockDownload).not.toHaveBeenCalled()
  })

  it('still works when services and settings cannot be loaded (edge case)', async () => {
    mockServices.mockRejectedValue(new Error('down'))
    mockSettings.mockRejectedValue(new Error('down'))
    render(<AdminGiftCardsPage />)
    fireEvent.click(screen.getByRole('radio', { name: 'Un monto' }))
    fireEvent.change(screen.getByLabelText('Para'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Monto ($)'), { target: { value: '100' } })
    expect(preview()).toContain('$ 100')
    expect(preview()).not.toContain('<image')
  })

  it('shows the validity in the preview only when a date is chosen', () => {
    render(<AdminGiftCardsPage />)
    expect(preview()).not.toContain('Válida hasta')
    fireEvent.change(screen.getByLabelText(/Válida hasta/), { target: { value: '2026-12-31' } })
    expect(preview()).toContain('Válida hasta el 31 dic 2026')
  })
})
