import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingConfigPage } from './LandingConfigPage'

const mockGetConfig = vi.fn()
const mockUpsert = vi.fn()
const mockAddImage = vi.fn()
const mockRemoveImage = vi.fn()
const mockUpload = vi.fn()
const mockDeleteMedia = vi.fn()

vi.mock('../hooks/useUser', () => ({
  useUser: () => ({ activeRole: 'admin', isLoading: false }),
}))

vi.mock('../lib/supabase', () => ({
  initSupabase: () => ({ storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }) } }),
}))

vi.mock('../services/adminLanding', () => ({
  adminGetLandingConfig: (...args: unknown[]) => mockGetConfig(...args),
  adminUpsertLandingConfig: (...args: unknown[]) => mockUpsert(...args),
  adminAddCarouselImage: (...args: unknown[]) => mockAddImage(...args),
  adminRemoveCarouselImage: (...args: unknown[]) => mockRemoveImage(...args),
  adminReorderCarouselImages: vi.fn(),
  uploadMediaFile: (...args: unknown[]) => mockUpload(...args),
  deleteMediaFile: (...args: unknown[]) => mockDeleteMedia(...args),
}))

const config = {
  heroTitle: null,
  heroSubtitle: null,
  aboutText: null,
  instagramUrl: null,
  whatsappNumber: null,
  primaryColor: '#f9a8d4',
  secondaryColor: '#fbcfe8',
  fontFamily: 'Inter',
  showHours: true,
  carouselImages: [],
}

const image = { id: 'i1', storagePath: 'carousel/1.jpg', altText: null }

function renderPage() {
  return render(
    <MemoryRouter>
      <LandingConfigPage />
    </MemoryRouter>,
  )
}

async function open(section: string) {
  fireEvent.click(await screen.findByRole('button', { name: `Editar ${section}` }))
}

describe('LandingConfigPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetConfig.mockResolvedValue(config)
    mockUpsert.mockResolvedValue(undefined)
  })

  it('lists the sections as titled blocks, each with its own Editar, and no popup open', async () => {
    renderPage()
    for (const title of ['Sección principal', 'Sobre nosotros', 'Diseño', 'Horarios', 'Carrusel de imágenes']) {
      expect(await screen.findByRole('button', { name: `Editar ${title}` })).toBeInTheDocument()
    }
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Guardar configuración' })).toBeNull()
  })

  it('no longer shows the old Instagram field, its own page title nor the social links (edge cases)', async () => {
    renderPage()
    await screen.findByRole('button', { name: 'Editar Diseño' })
    expect(screen.queryByLabelText('URL de Instagram')).toBeNull()
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    expect(screen.queryByText('Redes sociales')).toBeNull()
  })

  it('summarizes what is saved', async () => {
    mockGetConfig.mockResolvedValue({ ...config, heroTitle: 'Hola', heroSubtitle: 'Bienvenida', showHours: false, carouselImages: [image] })
    renderPage()
    expect(await screen.findByText('Hola')).toBeInTheDocument()
    expect(screen.getByText('Bienvenida')).toBeInTheDocument()
    expect(screen.getByText('No se muestran')).toBeInTheDocument()
    expect(screen.getByText('1 imagen')).toBeInTheDocument()
  })

  it('says what is empty (edge case)', async () => {
    renderPage()
    expect(await screen.findByText('Sin texto')).toBeInTheDocument()
    expect(screen.getByText('Sin imágenes')).toBeInTheDocument()
    expect(screen.getByText('Textos predeterminados')).toBeInTheDocument()
  })

  it('shortens a long "Sobre nosotros" in the summary (edge case)', async () => {
    mockGetConfig.mockResolvedValue({ ...config, aboutText: 'a'.repeat(300) })
    renderPage()
    expect(await screen.findByText(/^a{110}…$/)).toBeInTheDocument()
  })

  it('edits the hero in a popup and saves everything else as it was', async () => {
    mockGetConfig.mockResolvedValue({ ...config, aboutText: 'Mi historia', showHours: false })
    renderPage()
    await open('Sección principal')
    expect(screen.getByRole('dialog', { name: 'Editar sección principal' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Nuevo título' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ heroTitle: 'Nuevo título', aboutText: 'Mi historia', showHours: false, primaryColor: '#f9a8d4' }),
      ),
    )
    expect(await screen.findByText('Sección principal guardado correctamente.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText('Nuevo título')).toBeInTheDocument()
  })

  it('edits the design: colors and font (edge case: only that part changes)', async () => {
    renderPage()
    await open('Diseño')
    fireEvent.change(screen.getByLabelText('Color principal (código)'), { target: { value: '#112233' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ primaryColor: '#112233', secondaryColor: '#fbcfe8', fontFamily: 'Inter' })),
    )
  })

  it('toggles the hours', async () => {
    renderPage()
    await open('Horarios')
    fireEvent.click(screen.getByRole('checkbox', { name: /Mostrar horarios/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ showHours: false })))
    expect(await screen.findByText('No se muestran')).toBeInTheDocument()
  })

  it('Cancelar discards the edits and saves nothing (edge case)', async () => {
    mockGetConfig.mockResolvedValue({ ...config, aboutText: 'Original' })
    renderPage()
    await open('Sobre nosotros')
    fireEvent.change(screen.getByRole('textbox', { name: 'Sobre nosotros' }), { target: { value: 'Descartado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(mockUpsert).not.toHaveBeenCalled()
    await open('Sobre nosotros')
    expect((screen.getByRole('textbox', { name: 'Sobre nosotros' }) as HTMLTextAreaElement).value).toBe('Original')
  })

  it('shows a save error inside the popup and keeps it open (edge case)', async () => {
    mockUpsert.mockRejectedValue(new Error('x'))
    renderPage()
    await open('Horarios')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No se pudo guardar')
    expect(screen.getByRole('dialog')).toContainElement(alert)
  })

  it('shows an error when the config cannot be loaded (edge case)', async () => {
    mockGetConfig.mockRejectedValue(new Error('down'))
    renderPage()
    expect(await screen.findByText('No se pudo cargar la configuración.')).toBeInTheDocument()
  })

  it('the carousel popup has no Guardar, just Listo, and uploads at once', async () => {
    mockUpload.mockResolvedValue('x')
    mockAddImage.mockResolvedValue(image)
    renderPage()
    await open('Carrusel de imágenes')
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] } })
    await waitFor(() => expect(mockAddImage).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))
    expect(await screen.findByText('1 imagen')).toBeInTheDocument()
  })

  it('a failed upload shows the error inside the carousel popup (edge case)', async () => {
    mockUpload.mockRejectedValue(new Error('boom'))
    renderPage()
    await open('Carrusel de imágenes')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] } })
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No se pudo subir la imagen.')
    expect(screen.getByRole('dialog')).toContainElement(alert)
  })

  it('removing an image asks first and keeps it when cancelled (edge case)', async () => {
    mockGetConfig.mockResolvedValue({ ...config, carouselImages: [image] })
    mockRemoveImage.mockResolvedValue(undefined)
    mockDeleteMedia.mockResolvedValue(undefined)
    renderPage()
    await open('Carrusel de imágenes')
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(screen.getByText('¿Eliminar imagen?')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' }).at(-1)!)
    expect(mockRemoveImage).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' }).at(-1)!)
    await waitFor(() => expect(mockRemoveImage).toHaveBeenCalledWith('i1'))
    expect(await screen.findByText('No hay imágenes en el carrusel.')).toBeInTheDocument()
  })
})
