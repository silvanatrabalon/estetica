import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BrandSettingsForm } from './BrandSettingsForm'

const mockGetBrand = vi.fn()
const mockSaveBrand = vi.fn()
const mockUpload = vi.fn()

vi.mock('../../services/brand', () => ({
  getBrandSettings: (...a: unknown[]) => mockGetBrand(...a),
  saveBrandSettings: (...a: unknown[]) => mockSaveBrand(...a),
}))
vi.mock('../../services/adminLanding', () => ({
  uploadMediaFile: (...a: unknown[]) => mockUpload(...a),
}))

const empty = { logoUrl: null, bookingHeaderText: null, bookingSubtitleText: null }

describe('BrandSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBrand.mockResolvedValue(empty)
  })

  it('loads stored values', async () => {
    mockGetBrand.mockResolvedValue({ logoUrl: 'https://x/l.png', bookingHeaderText: 'Hola', bookingSubtitleText: 'Elegí' })
    render(<BrandSettingsForm />)

    await waitFor(() => expect((screen.getByLabelText('Título de la reserva') as HTMLInputElement).value).toBe('Hola'))
    expect((screen.getByLabelText('Subtítulo de la reserva') as HTMLInputElement).value).toBe('Elegí')
    expect(screen.getByAltText('Logo actual')).toHaveAttribute('src', 'https://x/l.png')
  })

  it('uploads the chosen image and saves its public URL', async () => {
    mockUpload.mockResolvedValue('https://cdn.test/media/logo/logo-1.png')
    mockSaveBrand.mockResolvedValue(undefined)
    render(<BrandSettingsForm />)

    const file = new File(['x'], 'mi-logo.png', { type: 'image/png' })
    fireEvent.change(await screen.findByLabelText('Subir logo'), { target: { files: [file] } })

    await waitFor(() =>
      expect(mockUpload).toHaveBeenCalledWith('media', expect.stringMatching(/^logo\/logo-\d+\.png$/), file),
    )
    expect(await screen.findByAltText('Logo actual')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar marca' }))
    await waitFor(() =>
      expect(mockSaveBrand).toHaveBeenCalledWith(
        expect.objectContaining({ logoUrl: 'https://cdn.test/media/logo/logo-1.png' }),
      ),
    )
    expect(await screen.findByText('Marca guardada correctamente.')).toBeDefined()
  })

  it('rejects a non-image file without uploading (edge case)', async () => {
    render(<BrandSettingsForm />)
    fireEvent.change(await screen.findByLabelText('Subir logo'), {
      target: { files: [new File(['x'], 'doc.pdf', { type: 'application/pdf' })] },
    })
    expect(await screen.findByText('El logo debe ser una imagen JPG, PNG, WEBP o GIF.')).toBeDefined()
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('rejects a file over 2 MB without uploading (edge case)', async () => {
    render(<BrandSettingsForm />)
    const big = new File(['x'], 'big.png', { type: 'image/png' })
    Object.defineProperty(big, 'size', { value: 3 * 1024 * 1024 })
    fireEvent.change(await screen.findByLabelText('Subir logo'), { target: { files: [big] } })
    expect(await screen.findByText('El logo no puede superar los 2 MB.')).toBeDefined()
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('keeps the previous logo and shows an error when the upload fails (edge case)', async () => {
    mockGetBrand.mockResolvedValue({ ...empty, logoUrl: 'https://old/l.png' })
    mockUpload.mockRejectedValue(new Error('boom'))
    render(<BrandSettingsForm />)

    fireEvent.change(await screen.findByLabelText('Subir logo'), {
      target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] },
    })

    expect(await screen.findByText('No se pudo subir el logo. Intentá de nuevo.')).toBeDefined()
    expect((screen.getByLabelText('O pegá la URL del logo') as HTMLInputElement).value).toBe('https://old/l.png')
  })

  it('does nothing when the file dialog is cancelled (edge case)', async () => {
    render(<BrandSettingsForm />)
    fireEvent.change(await screen.findByLabelText('Subir logo'), { target: { files: [] } })
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('removes the logo with "Quitar logo" and saves null', async () => {
    mockGetBrand.mockResolvedValue({ ...empty, logoUrl: 'https://old/l.png' })
    mockSaveBrand.mockResolvedValue(undefined)
    render(<BrandSettingsForm />)

    fireEvent.click(await screen.findByRole('button', { name: 'Quitar logo' }))
    expect(screen.queryByAltText('Logo actual')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar marca' }))
    await waitFor(() => expect(mockSaveBrand).toHaveBeenCalledWith(expect.objectContaining({ logoUrl: '' })))
  })

  it('blocks saving over-long booking texts (edge case)', async () => {
    render(<BrandSettingsForm />)
    fireEvent.change(await screen.findByLabelText('Título de la reserva'), { target: { value: 'a'.repeat(90) } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar marca' }))

    expect(await screen.findByText(/no puede superar los 80 caracteres/)).toBeDefined()
    expect(mockSaveBrand).not.toHaveBeenCalled()
  })

  it('shows an error when saving fails (edge case)', async () => {
    mockSaveBrand.mockRejectedValue(new Error('x'))
    render(<BrandSettingsForm />)
    fireEvent.click(await screen.findByRole('button', { name: 'Guardar marca' }))
    expect(await screen.findByText('No pudimos guardar los cambios. Intentá nuevamente.')).toBeDefined()
  })

  it('still renders when loading fails (edge case)', async () => {
    mockGetBrand.mockRejectedValue(new Error('down'))
    render(<BrandSettingsForm />)
    expect(((await screen.findByLabelText('Título de la reserva')) as HTMLInputElement).value).toBe('')
  })
})
