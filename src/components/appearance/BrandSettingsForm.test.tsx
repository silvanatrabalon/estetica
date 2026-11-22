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
const stored = { logoUrl: 'https://x/l.png', bookingHeaderText: 'Hola', bookingSubtitleText: 'Elegí' }

async function openLogo() {
  fireEvent.click(await screen.findByRole('button', { name: 'Editar Logo' }))
}

describe('BrandSettingsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBrand.mockResolvedValue(empty)
    mockSaveBrand.mockResolvedValue(undefined)
  })

  it('shows the logo block with its current value, no popup open and no booking texts block', async () => {
    mockGetBrand.mockResolvedValue(stored)
    render(<BrandSettingsForm />)
    expect(await screen.findByAltText('Logo actual')).toHaveAttribute('src', 'https://x/l.png')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Editar Pantalla de reservas' })).toBeNull()
  })

  it('says so when nothing is set (edge case)', async () => {
    render(<BrandSettingsForm />)
    expect(await screen.findByText('Sin logo')).toBeInTheDocument()
  })

  it('uploads the chosen image and saves its public URL, keeping the texts stored before (edge case)', async () => {
    mockGetBrand.mockResolvedValue({ ...empty, bookingHeaderText: 'Hola' })
    mockUpload.mockResolvedValue('https://cdn.test/media/logo/logo-1.png')
    render(<BrandSettingsForm />)
    await screen.findByText('Sin logo')
    await openLogo()

    const file = new File(['x'], 'mi-logo.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Subir logo'), { target: { files: [file] } })
    await waitFor(() =>
      expect(mockUpload).toHaveBeenCalledWith('media', expect.stringMatching(/^logo\/logo-\d+\.png$/), file),
    )
    expect(await screen.findByAltText('Logo elegido')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(mockSaveBrand).toHaveBeenCalledWith(
        expect.objectContaining({ logoUrl: 'https://cdn.test/media/logo/logo-1.png', bookingHeaderText: 'Hola' }),
      ),
    )
    expect(await screen.findByText('Logo guardado correctamente.')).toBeDefined()
    expect(screen.getByAltText('Logo actual')).toHaveAttribute('src', 'https://cdn.test/media/logo/logo-1.png')
  })

  it('rejects a non-image file without uploading (edge case)', async () => {
    render(<BrandSettingsForm />)
    await openLogo()
    fireEvent.change(screen.getByLabelText('Subir logo'), {
      target: { files: [new File(['x'], 'doc.pdf', { type: 'application/pdf' })] },
    })
    expect(await screen.findByText('El logo debe ser una imagen JPG, PNG, WEBP o GIF.')).toBeDefined()
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('rejects a file over 2 MB without uploading (edge case)', async () => {
    render(<BrandSettingsForm />)
    await openLogo()
    const big = new File(['x'], 'big.png', { type: 'image/png' })
    Object.defineProperty(big, 'size', { value: 3 * 1024 * 1024 })
    fireEvent.change(screen.getByLabelText('Subir logo'), { target: { files: [big] } })
    expect(await screen.findByText('El logo no puede superar los 2 MB.')).toBeDefined()
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('keeps the previous logo and shows an error when the upload fails (edge case)', async () => {
    mockGetBrand.mockResolvedValue({ ...empty, logoUrl: 'https://old/l.png' })
    mockUpload.mockRejectedValue(new Error('boom'))
    render(<BrandSettingsForm />)
    await screen.findByAltText('Logo actual')
    await openLogo()
    fireEvent.change(screen.getByLabelText('Subir logo'), {
      target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] },
    })
    expect(await screen.findByText('No se pudo subir el logo. Intentá de nuevo.')).toBeDefined()
    expect((screen.getByLabelText('O pegá la URL del logo') as HTMLInputElement).value).toBe('https://old/l.png')
  })

  it('does nothing when the file dialog is cancelled (edge case)', async () => {
    render(<BrandSettingsForm />)
    await openLogo()
    fireEvent.change(screen.getByLabelText('Subir logo'), { target: { files: [] } })
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('removes the logo with "Quitar logo" and saves it empty', async () => {
    mockGetBrand.mockResolvedValue({ ...empty, logoUrl: 'https://old/l.png' })
    render(<BrandSettingsForm />)
    await screen.findByAltText('Logo actual')
    await openLogo()
    fireEvent.click(screen.getByRole('button', { name: 'Quitar logo' }))
    expect(screen.queryByAltText('Logo elegido')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(mockSaveBrand).toHaveBeenCalledWith(expect.objectContaining({ logoUrl: '' })))
    expect(await screen.findByText('Sin logo')).toBeInTheDocument()
  })

  it('Cancelar discards the edits and saves nothing (edge case)', async () => {
    mockGetBrand.mockResolvedValue(stored)
    render(<BrandSettingsForm />)
    await screen.findByAltText('Logo actual')
    await openLogo()
    fireEvent.change(screen.getByLabelText('O pegá la URL del logo'), { target: { value: 'https://otro/x.png' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(mockSaveBrand).not.toHaveBeenCalled()
    await openLogo()
    expect((screen.getByLabelText('O pegá la URL del logo') as HTMLInputElement).value).toBe('https://x/l.png')
  })

  it('shows an error inside the popup when saving fails and keeps it open (edge case)', async () => {
    mockSaveBrand.mockRejectedValue(new Error('x'))
    render(<BrandSettingsForm />)
    await openLogo()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('No pudimos guardar los cambios. Intentá nuevamente.')).toBeDefined()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('still renders when loading fails (edge case)', async () => {
    mockGetBrand.mockRejectedValue(new Error('down'))
    render(<BrandSettingsForm />)
    expect(await screen.findByText('Sin logo')).toBeInTheDocument()
  })
})
