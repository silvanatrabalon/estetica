import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminServicesPage } from './AdminServicesPage'
import { TestUserProvider } from '../hooks/__test-utils__/test-providers'
import { mockSessions } from '../hooks/__test-utils__/fixtures'

const mockListServices = vi.fn()
const mockCreateService = vi.fn()
const mockUpdateService = vi.fn()
const mockSetServiceActive = vi.fn()
const mockUploadMediaFile = vi.fn()
const mockDeleteMediaFile = vi.fn()

vi.mock('../services/adminServices', () => ({
  listServices: (...args: unknown[]) => mockListServices(...args),
  createService: (...args: unknown[]) => mockCreateService(...args),
  updateService: (...args: unknown[]) => mockUpdateService(...args),
  setServiceActive: (...args: unknown[]) => mockSetServiceActive(...args),
}))

const mockListDates = vi.fn()
vi.mock('../services/adminServiceAvailability', () => ({
  listServiceAvailableDates: (...args: unknown[]) => mockListDates(...args),
  addServiceAvailableDate: vi.fn(),
  removeServiceAvailableDate: vi.fn(),
}))

vi.mock('../services/adminLanding', () => ({
  uploadMediaFile: (...args: unknown[]) => mockUploadMediaFile(...args),
  deleteMediaFile: (...args: unknown[]) => mockDeleteMediaFile(...args),
}))

const mockListCategories = vi.fn()
const mockCreateCategory = vi.fn()
const mockUpdateCategory = vi.fn()

vi.mock('../services/adminCategories', () => ({
  adminListCategories: (...args: unknown[]) => mockListCategories(...args),
  adminCreateCategory: (...args: unknown[]) => mockCreateCategory(...args),
  adminUpdateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
  adminDeleteCategory: vi.fn(),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <TestUserProvider
        user={mockSessions.authenticatedAdmin.user}
        roles={['admin']}
        activeRole="admin"
        isLoading={false}
      >
        <AdminServicesPage />
      </TestUserProvider>
    </MemoryRouter>,
  )
}

// The list is cards on every screen size (no table), so queries go straight to the screen.
function getTable() {
  return screen
}

function setDuration(hours: string, mins: string) {
  fireEvent.change(screen.getByLabelText('Horas'), { target: { value: hours } })
  fireEvent.change(screen.getByLabelText('Minutos'), { target: { value: mins } })
}

async function openCreateForm() {
  fireEvent.click(await screen.findByRole('button', { name: /Agregar servicio/ }))
  await screen.findByLabelText('Nombre')
}

const mockService = {
  id: 'svc-1',
  organizationId: 'org-1',
  name: 'Corte de cabello',
  durationMinutes: 60,
  priceCents: 500000,
  imageUrl: null,
  isActive: true,
  maxConcurrentBookings: null,
  description: null,
  categoryId: null,
  categoryName: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('AdminServicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListCategories.mockResolvedValue([])
  })

  it('shows loading state initially', () => {
    mockListServices.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Cargando servicios...')).toBeDefined()
  })

  it('shows empty state when no services exist', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText('No hay servicios registrados todavía.')).toBeDefined()
    })
  })

  it('renders service list with data', async () => {
    mockListServices.mockResolvedValue([mockService])
    renderPage()
    await waitFor(() => {
      expect(getTable().getByText('Corte de cabello')).toBeDefined()
      expect(getTable().getByText('60 min')).toBeDefined()
      expect(getTable().getByText('Activo')).toBeDefined()
    })
  })

  it('shows validation error for empty service name', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await openCreateForm()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: '' } })
    setDuration('1', '0')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(screen.getByText('El nombre debe tener al menos 2 caracteres.')).toBeDefined()
    })
  })

  it('shows validation error for duration out of range', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await openCreateForm()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte' } })
    setDuration('8', '1')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(
        screen.getByText('La duración debe ser entre 1 y 480 minutos (hasta 8 horas).'),
      ).toBeDefined()
    })
  })

  it('shows description textarea in create form', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await openCreateForm()

    await waitFor(() => {
      expect(screen.getByLabelText(/Descripción/)).toBeDefined()
    })
  })

  it('calls createService and shows success message', async () => {
    mockListServices.mockResolvedValue([])
    mockCreateService.mockResolvedValue(mockService)
    renderPage()

    await openCreateForm()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte de cabello' } })
    setDuration('1', '0')
    fireEvent.change(screen.getByLabelText('Precio ($)'), { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mockCreateService).toHaveBeenCalledWith({
        name: 'Corte de cabello',
        durationMinutes: 60,
        priceCents: 500000,
        imageUrl: null,
        maxConcurrentBookings: null,
        description: null,
        categoryId: null,
      })
      expect(screen.getByText('Servicio creado correctamente.')).toBeDefined()
    })
  })

  it('editing a service without a limit keeps the capacity blank, not 1 (edge case)', async () => {
    mockListServices.mockResolvedValue([mockService])
    renderPage()

    await waitFor(() => {
      expect(getTable().getByText('Corte de cabello')).toBeDefined()
    })
    fireEvent.click(getTable().getByRole('button', { name: 'Editar' }))

    await waitFor(() => {
      expect((screen.getByLabelText(/Límite por recurso/) as HTMLInputElement).value).toBe('')
    })
  })

  it('editing a service keeps its stored capacity (edge case)', async () => {
    mockListServices.mockResolvedValue([{ ...mockService, maxConcurrentBookings: 3 }])
    renderPage()

    await waitFor(() => {
      expect(getTable().getByText('Corte de cabello')).toBeDefined()
    })
    fireEvent.click(getTable().getByRole('button', { name: 'Editar' }))

    await waitFor(() => {
      expect((screen.getByLabelText(/Límite por recurso/) as HTMLInputElement).value).toBe('3')
    })
  })

  it('calls updateService when editing an existing service', async () => {
    mockListServices.mockResolvedValue([mockService])
    mockUpdateService.mockResolvedValue({ ...mockService, name: 'Corte actualizado' })
    renderPage()

    await waitFor(() => {
      expect(getTable().getByText('Corte de cabello')).toBeDefined()
    })

    fireEvent.click(getTable().getByRole('button', { name: 'Editar' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Nombre')).toBeDefined()
    })

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte actualizado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mockUpdateService).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceId: 'svc-1',
          name: 'Corte actualizado',
        }),
      )
      expect(screen.getByText('Servicio actualizado correctamente.')).toBeDefined()
    })
  })

  it('calls setServiceActive with false to deactivate', async () => {
    mockListServices.mockResolvedValue([mockService])
    mockSetServiceActive.mockResolvedValue(undefined)
    renderPage()

    await waitFor(() => {
      expect(getTable().getByText('Corte de cabello')).toBeDefined()
    })

    fireEvent.click(getTable().getByRole('button', { name: 'Desactivar' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDefined()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(mockSetServiceActive).toHaveBeenCalledWith('svc-1', false)
      expect(screen.getByText('"Corte de cabello" fue desactivado.')).toBeDefined()
    })
  })

  it('calls setServiceActive with true to reactivate', async () => {
    const inactiveService = { ...mockService, isActive: false }
    mockListServices.mockResolvedValue([inactiveService])
    mockSetServiceActive.mockResolvedValue(undefined)
    renderPage()

    await waitFor(() => {
      expect(getTable().getByText('Inactivo')).toBeDefined()
    })

    fireEvent.click(getTable().getByRole('button', { name: 'Reactivar' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDefined()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(mockSetServiceActive).toHaveBeenCalledWith('svc-1', true)
      expect(screen.getByText('"Corte de cabello" fue reactivado.')).toBeDefined()
    })
  })

  it('shows error message when load fails', async () => {
    mockListServices.mockRejectedValue(new Error('Network error'))
    renderPage()

    await waitFor(() => {
      expect(
        screen.getByText('No pudimos cargar el catálogo de servicios en este momento.'),
      ).toBeDefined()
    })
  })

  it('capacity field renders in service create form', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await openCreateForm()

    await waitFor(() => {
      expect(screen.getByLabelText(/Límite por recurso/)).toBeDefined()
    })
  })

  it('shows validation error when capacity is 0', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await openCreateForm()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte' } })
    setDuration('1', '0')
    fireEvent.change(screen.getByLabelText(/Límite por recurso/), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(
        screen.getByText('La capacidad debe ser un número entero mayor a cero.'),
      ).toBeDefined()
    })
  })

  it('the shared-resource limit is empty by default in the create form', async () => {
    mockListServices.mockResolvedValue([])
    renderPage()

    await openCreateForm()

    expect((screen.getByLabelText(/Límite por recurso/) as HTMLInputElement).value).toBe('')
  })

  it('submitting without touching the limit sends no limit to createService', async () => {
    mockListServices.mockResolvedValue([])
    mockCreateService.mockResolvedValue({ ...mockService, maxConcurrentBookings: null })
    renderPage()

    await openCreateForm()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte de cabello' } })
    setDuration('1', '0')
    fireEvent.change(screen.getByLabelText('Precio ($)'), { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mockCreateService).toHaveBeenCalledWith(
        expect.objectContaining({ maxConcurrentBookings: null }),
      )
    })
  })

  it('submitting with blank capacity passes null to createService', async () => {
    mockListServices.mockResolvedValue([])
    mockCreateService.mockResolvedValue({ ...mockService, maxConcurrentBookings: null })
    renderPage()

    await openCreateForm()

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte de cabello' } })
    setDuration('1', '0')
    fireEvent.change(screen.getByLabelText('Precio ($)'), { target: { value: '5000' } })
    fireEvent.change(screen.getByLabelText(/Límite por recurso/), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mockCreateService).toHaveBeenCalledWith(
        expect.objectContaining({ maxConcurrentBookings: null }),
      )
    })
  })

  it('renders the Disponibilidad button per service card', async () => {
    mockListServices.mockResolvedValue([mockService])
    renderPage()

    await waitFor(() => {
      expect(getTable().getByText('Corte de cabello')).toBeDefined()
    })

    expect(getTable().getByRole('button', { name: 'Disponibilidad' })).toBeDefined()
  })
})

describe('AdminServicesPage — tabs, filter and inline category', () => {
  const makeCategory = (id: string, name: string) => ({ id, name, displayOrder: 0, organizationId: 'org-1' })
  const withCat = { ...mockService, id: 'svc-2', name: 'Masaje', categoryId: 'cat-1', categoryName: 'Corporal' }
  const noCat = { ...mockService, id: 'svc-3', name: 'Limpieza' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockListCategories.mockResolvedValue([makeCategory('cat-1', 'Corporal')])
  })

  it('starts on the Servicios tab and switches to Categorías', async () => {
    mockListServices.mockResolvedValue([mockService])
    renderPage()
    expect(await screen.findByRole('tab', { name: 'Servicios' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('button', { name: '+ Nueva categoría' })).toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: 'Categorías' }))
    expect(screen.getByRole('button', { name: '+ Nueva categoría' })).toBeInTheDocument()
    expect(screen.getByText('Corporal')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Agregar servicio/ })).toBeNull()
  })

  it('"Todos" lists services with and without category', async () => {
    mockListServices.mockResolvedValue([withCat, noCat])
    renderPage()
    await screen.findByRole('tab', { name: 'Servicios' })
    expect(getTable().getByText('Masaje')).toBeInTheDocument()
    expect(getTable().getByText('Limpieza')).toBeInTheDocument()
  })

  it('filtering by a category hides the others; "Sin categoría" shows only the uncategorized ones', async () => {
    mockListServices.mockResolvedValue([withCat, noCat])
    renderPage()
    await screen.findByRole('tab', { name: 'Servicios' })

    fireEvent.click(screen.getByRole('button', { name: /Todos/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Corporal' }))
    expect(getTable().getByText('Masaje')).toBeInTheDocument()
    expect(getTable().queryByText('Limpieza')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Corporal/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Sin categoría' }))
    expect(getTable().getByText('Limpieza')).toBeInTheDocument()
    expect(getTable().queryByText('Masaje')).toBeNull()
  })

  it('a category with no services shows an empty message (edge case)', async () => {
    mockListCategories.mockResolvedValue([makeCategory('cat-1', 'Corporal'), makeCategory('cat-2', 'Facial')])
    mockListServices.mockResolvedValue([withCat])
    renderPage()
    await screen.findByRole('tab', { name: 'Servicios' })
    fireEvent.click(screen.getByRole('button', { name: /Todos/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Facial' }))
    expect(screen.getByText('No hay servicios en esta categoría.')).toBeInTheDocument()
  })

  async function openInlineCategory() {
    mockListServices.mockResolvedValue([])
    renderPage()
    await openCreateForm()
    fireEvent.click(screen.getByRole('button', { name: /Categoría/ }))
    fireEvent.click(screen.getByRole('option', { name: '+ Crear categoría nueva' }))
  }

  it('the category dropdown offers creating a new category and selects it for the service', async () => {
    mockCreateCategory.mockResolvedValue(makeCategory('cat-9', 'Uñas'))
    mockCreateService.mockResolvedValue({ ...mockService, categoryId: 'cat-9', categoryName: 'Uñas' })
    await openInlineCategory()

    fireEvent.change(screen.getByLabelText('Nombre de la nueva categoría'), { target: { value: 'Uñas' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear categoría' }))
    await waitFor(() => expect(mockCreateCategory).toHaveBeenCalledWith('Uñas', 1))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Categoría/ }).textContent).toContain('Uñas'),
    )

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Esmaltado' } })
    setDuration('1', '0')
    fireEvent.change(screen.getByLabelText('Precio ($)'), { target: { value: '3000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(mockCreateService).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'cat-9' })),
    )
  })

  it('an empty category name is rejected without calling the backend (edge case)', async () => {
    await openInlineCategory()
    fireEvent.click(screen.getByRole('button', { name: 'Crear categoría' }))
    expect(await screen.findByText('Escribí el nombre de la categoría.')).toBeInTheDocument()
    expect(mockCreateCategory).not.toHaveBeenCalled()
  })

  it('a duplicated category name shows a friendly error and keeps the form open (edge case)', async () => {
    mockCreateCategory.mockRejectedValue(new Error('duplicate key value violates unique constraint'))
    await openInlineCategory()
    fireEvent.change(screen.getByLabelText('Nombre de la nueva categoría'), { target: { value: 'Corporal' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear categoría' }))
    expect(await screen.findByText('Ya existe una categoría con ese nombre.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
  })

  it('cancelling the inline category keeps the service form (edge case)', async () => {
    await openInlineCategory()
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancelar' })[0])
    expect(screen.queryByLabelText('Nombre de la nueva categoría')).toBeNull()
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
  })
})

describe('AdminServicesPage — create and edit in a pop-up', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListServices.mockResolvedValue([mockService])
    mockListCategories.mockResolvedValue([])
    mockUpdateService.mockResolvedValue({ ...mockService, name: 'Corte nuevo' })
  })

  async function openEdit() {
    renderPage()
    await waitFor(() => expect(getTable().getByText('Corte de cabello')).toBeDefined())
    fireEvent.click(getTable().getByRole('button', { name: 'Editar' }))
    return screen.findByRole('dialog', { name: 'Editar servicio' })
  }

  it('"Editar" opens a pop-up (sheet on phones, centered on larger screens) with the service loaded', async () => {
    const dialog = await openEdit()
    expect(dialog.parentElement?.className).toContain('fixed inset-0')
    expect(dialog.parentElement?.className).toContain('items-end')
    expect(dialog.parentElement?.className).toContain('sm:items-center')
    expect(dialog.className).toContain('max-h-[92dvh]')
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('Corte de cabello')
  })

  it('"Agregar servicio" opens the same pop-up, empty, titled "Nuevo servicio"', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: /Agregar servicio/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Nuevo servicio' })
    expect(dialog).toBeInTheDocument()
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('')
  })

  it('the list and the add button stay on the page behind the pop-up', async () => {
    await openEdit()
    expect(getTable().getByText('Corte de cabello')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Agregar servicio/ })).toBeInTheDocument()
  })

  it('saving closes the pop-up and shows the success notice on the page', async () => {
    await openEdit()
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corte nuevo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(mockUpdateService).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(await screen.findByText('Servicio actualizado correctamente.')).toBeInTheDocument()
  })

  it('a failed save keeps the pop-up open and shows the error inside it, once (edge case)', async () => {
    mockUpdateService.mockRejectedValue(new Error('unique_violation'))
    const dialog = await openEdit()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(dialog).toHaveTextContent('Ya existe un servicio con ese nombre.'))
    expect(screen.getAllByText('Ya existe un servicio con ese nombre.')).toHaveLength(1)
  })

  it('Cancelar and Escape close it without saving (edge case)', async () => {
    await openEdit()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(getTable().getByRole('button', { name: 'Editar' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(mockUpdateService).not.toHaveBeenCalled()
  })

  it('opening "Agregar" after "Editar" does not carry the old data (edge case)', async () => {
    await openEdit()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: /Agregar servicio/ }))
    await screen.findByRole('dialog', { name: 'Nuevo servicio' })
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('')
  })

  it('Nombre and Categoría share the first row, Categoría on the right', async () => {
    await openEdit()
    const name = screen.getByLabelText('Nombre')
    const category = screen.getByLabelText('Categoría')
    const row = name.parentElement!.parentElement!
    expect(row).toContainElement(category)
    expect(row.className).toContain('grid-cols-[minmax(0,1fr)_8.5rem]')
    expect(name.compareDocumentPosition(category) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('Horas and Minutos are small and sit in the same row as Precio', async () => {
    await openEdit()
    const hours = screen.getByLabelText('Horas')
    const minutes = screen.getByLabelText('Minutos')
    const price = screen.getByLabelText('Precio ($)')
    expect(hours.parentElement?.className).toContain('w-16')
    expect(minutes.parentElement?.className).toContain('w-16')
    expect(hours.parentElement?.parentElement).toBe(price.parentElement?.parentElement)
  })

  it('creating a category inline still opens under the Nombre / Categoría row (edge case)', async () => {
    await openEdit()
    fireEvent.click(screen.getByRole('button', { name: /Categoría/ }))
    fireEvent.click(await screen.findByRole('option', { name: '+ Crear categoría nueva' }))
    const box = await screen.findByLabelText('Nombre de la nueva categoría')
    const row = screen.getByLabelText('Nombre').parentElement!.parentElement!
    expect(row).not.toContainElement(box)
    expect(screen.getByRole('button', { name: 'Crear categoría' })).toBeInTheDocument()
  })

  it('the advanced option ends its explanation with an example: Camilla solar', async () => {
    await openEdit()
    expect(screen.getByText(/como una única cabina o un solo aparato\. Ej: Camilla solar\./)).toBeInTheDocument()
  })
})

describe('AdminServicesPage — same cards on desktop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListServices.mockResolvedValue([mockService])
    mockListCategories.mockResolvedValue([])
  })

  it('there is no table: the list is cards for every screen size', async () => {
    renderPage()
    await screen.findByText('Corte de cabello')
    expect(screen.queryByRole('table')).toBeNull()
    const card = screen.getByText('Corte de cabello').closest('div.border')!
    expect(card.parentElement?.className).not.toContain('md:hidden')
    expect(card.parentElement?.className).not.toContain('hidden')
    expect(within(card as HTMLElement).getByText('60 min')).toBeInTheDocument()
    expect(within(card as HTMLElement).getByRole('button', { name: 'Editar' })).toBeInTheDocument()
    expect(within(card as HTMLElement).getByRole('button', { name: 'Desactivar' })).toBeInTheDocument()
  })

  it('each service appears only once, not once per layout (edge case)', async () => {
    renderPage()
    await screen.findByText('Corte de cabello')
    expect(screen.getAllByText('Corte de cabello')).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(1)
  })
})

describe('AdminServicesPage — categories in pop-ups and cleaner icons', () => {
  const cat = (id: string, name: string, displayOrder = 0) => ({ id, name, displayOrder, organizationId: 'org-1' })

  beforeEach(() => {
    vi.clearAllMocks()
    mockListServices.mockResolvedValue([mockService])
    mockListCategories.mockResolvedValue([cat('c1', 'Corporal'), cat('c2', 'Manos', 1)])
    mockCreateCategory.mockResolvedValue(cat('c3', 'Pies', 2))
    mockUpdateCategory.mockResolvedValue(cat('c1', 'Corporales'))
  })

  async function openCategories() {
    renderPage()
    fireEvent.click(await screen.findByRole('tab', { name: 'Categorías' }))
    await screen.findByText('Corporal')
  }

  it('"Nueva categoría" opens a pop-up (sheet on phones, centered on larger screens) and the form is not on the page', async () => {
    await openCategories()
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '+ Nueva categoría' }))
    const dialog = screen.getByRole('dialog', { name: 'Nueva categoría' })
    expect(dialog.parentElement?.className).toContain('items-end')
    expect(dialog.parentElement?.className).toContain('sm:items-center')
    expect(dialog.className).toContain('max-h-[92dvh]')
    expect(screen.getByLabelText('Nombre')).toHaveFocus()
  })

  it('creating closes the pop-up, adds the pill and shows the notice', async () => {
    await openCategories()
    fireEvent.click(screen.getByRole('button', { name: '+ Nueva categoría' }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Pies' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }))
    await waitFor(() => expect(mockCreateCategory).toHaveBeenCalledWith('Pies', 2))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByText('Pies')).toBeInTheDocument()
    expect(screen.getByText('Categoría creada correctamente.')).toBeInTheDocument()
  })

  it('Crear needs a name (edge case)', async () => {
    await openCategories()
    fireEvent.click(screen.getByRole('button', { name: '+ Nueva categoría' }))
    expect(screen.getByRole('button', { name: 'Crear' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: '   ' } })
    expect(screen.getByRole('button', { name: 'Crear' })).toBeDisabled()
  })

  it('a failed creation keeps the pop-up open with the error inside, once (edge case)', async () => {
    mockCreateCategory.mockRejectedValue(new Error('duplicate key'))
    await openCategories()
    fireEvent.click(screen.getByRole('button', { name: '+ Nueva categoría' }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Manos' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }))
    const dialog = screen.getByRole('dialog', { name: 'Nueva categoría' })
    await waitFor(() => expect(dialog).toHaveTextContent('Ya existe una categoría con ese nombre.'))
    expect(screen.getAllByText('Ya existe una categoría con ese nombre.')).toHaveLength(1)
  })

  it('the pencil opens the same pop-up to edit, with the name loaded, and saving updates the pill', async () => {
    await openCategories()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Corporal' }))
    expect(screen.getByRole('dialog', { name: 'Editar categoría' })).toBeInTheDocument()
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('Corporal')
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Corporales' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(mockUpdateCategory).toHaveBeenCalledWith('c1', 'Corporales', 0))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByText('Corporales')).toBeInTheDocument()
    expect(screen.getByText('Categoría actualizada.')).toBeInTheDocument()
  })

  it('Cancelar and Escape close it without saving, and a new one opens empty after an edit (edge case)', async () => {
    await openCategories()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Corporal' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '+ Nueva categoría' }))
    expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(mockUpdateCategory).not.toHaveBeenCalled()
    expect(mockCreateCategory).not.toHaveBeenCalled()
  })

  it('the edit and delete buttons use line icons in the app style, not emoji or symbols', async () => {
    await openCategories()
    const edit = screen.getByRole('button', { name: 'Editar Corporal' })
    const remove = screen.getByRole('button', { name: 'Eliminar Corporal' })
    for (const button of [edit, remove]) {
      expect(button.querySelector('svg')).not.toBeNull()
      expect(button.querySelector('svg')?.getAttribute('stroke')).toBe('currentColor')
      expect(button.textContent).toBe('')
    }
  })

  it('with no categories it says so and the add button is there (edge case)', async () => {
    mockListCategories.mockResolvedValue([])
    renderPage()
    fireEvent.click(await screen.findByRole('tab', { name: 'Categorías' }))
    expect(screen.getByText('Sin categorías todavía.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Nueva categoría' })).toBeInTheDocument()
  })
})

describe('AdminServicesPage — Disponibilidad in a pop-up', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListServices.mockResolvedValue([mockService])
    mockListCategories.mockResolvedValue([])
    mockListDates.mockResolvedValue([])
  })

  it('"Disponibilidad" opens the pop-up over the list, with the service name, without navigating', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Disponibilidad' }))
    const dialog = await screen.findByRole('dialog', { name: 'Disponibilidad del servicio' })
    expect(dialog).toHaveTextContent('Corte de cabello')
    expect(mockListDates).toHaveBeenCalledWith('svc-1')
    expect(screen.getByText('Corte de cabello', { selector: 'p.font-medium' })).toBeInTheDocument() // the list is still behind
  })

  it('closing it goes back to the list (edge case)', async () => {
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'Disponibilidad' }))
    await screen.findByRole('dialog', { name: 'Disponibilidad del servicio' })
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('/admin/services/:serviceId/availability opens it directly over the list (edge case)', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/services/svc-1/availability']}>
        <TestUserProvider user={mockSessions.authenticatedAdmin.user} roles={['admin']} activeRole="admin" isLoading={false}>
          <Routes>
            <Route path="/admin/services/:serviceId/availability" element={<AdminServicesPage />} />
            <Route path="/admin/services" element={<AdminServicesPage />} />
          </Routes>
        </TestUserProvider>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('dialog', { name: 'Disponibilidad del servicio' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByRole('button', { name: 'Disponibilidad' })).toBeInTheDocument()
  })
})
