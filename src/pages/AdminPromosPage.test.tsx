import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AdminPromosPage } from './AdminPromosPage'

const mockList = vi.fn()
const mockSave = vi.fn()
const mockSetActive = vi.fn()
const mockDelete = vi.fn()
const mockServices = vi.fn()

vi.mock('../services/promos', () => ({
  adminListPromos: (...a: unknown[]) => mockList(...a),
  adminSavePromo: (...a: unknown[]) => mockSave(...a),
  adminSetPromoActive: (...a: unknown[]) => mockSetActive(...a),
  adminDeletePromo: (...a: unknown[]) => mockDelete(...a),
}))
vi.mock('../services/adminServices', () => ({
  listServices: (...a: unknown[]) => mockServices(...a),
}))

const promo = {
  id: 'p1',
  name: 'Semana de manos',
  description: 'Todo con descuento',
  discountType: 'percent' as const,
  discountValue: 20,
  startsOn: '2000-01-01',
  endsOn: '2099-12-31',
  isActive: true,
  showOnSite: true,
  serviceIds: ['s1'],
  serviceNames: ['Manicura'],
  timesUsed: 2,
}

const services = [
  { id: 's1', name: 'Manicura', isActive: true },
  { id: 's2', name: 'Pedicura', isActive: false },
]

async function openForm() {
  fireEvent.click(await screen.findByRole('button', { name: '+ Nueva promo' }))
}

function fillBasics() {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Verano' } })
  fireEvent.change(screen.getByLabelText('Porcentaje (%)'), { target: { value: '15' } })
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-06-01' } })
  fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-06-30' } })
}

describe('AdminPromosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockList.mockResolvedValue([promo])
    mockServices.mockResolvedValue(services)
    mockSave.mockResolvedValue(undefined)
    mockSetActive.mockResolvedValue(undefined)
    mockDelete.mockResolvedValue(undefined)
  })

  it('lists promos with discount, services, validity, usage and flags', async () => {
    render(<AdminPromosPage />)
    expect(await screen.findByText('Semana de manos')).toBeInTheDocument()
    expect(screen.getByText('20% OFF')).toBeInTheDocument()
    expect(screen.getByText(/Manicura/)).toBeInTheDocument()
    expect(screen.getByText(/2 usos/)).toBeInTheDocument()
    expect(screen.getByText('Vigente')).toBeInTheDocument()
    expect(screen.getByText('En el sitio web')).toBeInTheDocument()
  })

  it('shows an empty state (edge case)', async () => {
    mockList.mockResolvedValue([])
    render(<AdminPromosPage />)
    expect(await screen.findByText('Todavía no creaste promos')).toBeInTheDocument()
  })

  it('shows the error when the list fails (edge case)', async () => {
    mockList.mockRejectedValue(new Error('boom'))
    render(<AdminPromosPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('boom')
  })

  it('a promo hidden from the website has no website badge (edge case)', async () => {
    mockList.mockResolvedValue([{ ...promo, showOnSite: false }])
    render(<AdminPromosPage />)
    await screen.findByText('Semana de manos')
    expect(screen.queryByText('En el sitio web')).toBeNull()
  })

  it('creates a promo for the chosen services and the website flag', async () => {
    render(<AdminPromosPage />)
    await openForm()
    fillBasics()
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Manicura' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Mostrar esta promo en el sitio web/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(mockSave).toHaveBeenCalled())
    expect(mockSave.mock.calls[0][0]).toMatchObject({
      id: null, name: 'Verano', discountType: 'percent', discountValue: 15,
      startsOn: '2026-06-01', endsOn: '2026-06-30', serviceIds: ['s1'], showOnSite: true, isActive: true,
    })
    expect(await screen.findByText('Promo creada.')).toBeInTheDocument()
  })

  it('a new promo starts hidden from the website (edge case)', async () => {
    render(<AdminPromosPage />)
    await openForm()
    expect(screen.getByRole('checkbox', { name: /Mostrar esta promo en el sitio web/ })).not.toBeChecked()
  })

  it('does not save an incomplete form and shows each problem (edge case)', async () => {
    render(<AdminPromosPage />)
    await openForm()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Elegí al menos un servicio.')).toBeInTheDocument()
    expect(screen.getByText('Elegí desde cuándo vale la promo.')).toBeInTheDocument()
    expect(screen.getByText('Ingresá un valor mayor a cero.')).toBeInTheDocument()
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('shows the server error inside the popup and keeps it open (edge case)', async () => {
    mockSave.mockRejectedValue(new Error('Elegí al menos un servicio.'))
    render(<AdminPromosPage />)
    await openForm()
    fillBasics()
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Manicura' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Elegí al menos un servicio.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('edits a promo with its values loaded, and Escape closes the popup', async () => {
    render(<AdminPromosPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Editar Semana de manos' }))
    expect(screen.getByLabelText('Nombre')).toHaveValue('Semana de manos')
    expect(screen.getByRole('checkbox', { name: 'Manicura' })).toBeChecked()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('marks inactive services in the picker (edge case)', async () => {
    render(<AdminPromosPage />)
    await openForm()
    expect(await screen.findByText(/Pedicura/)).toHaveTextContent('(inactivo)')
  })

  it('still opens the form when services fail to load (edge case)', async () => {
    mockServices.mockRejectedValue(new Error('x'))
    render(<AdminPromosPage />)
    await openForm()
    expect(await screen.findByText('No hay servicios para elegir.')).toBeInTheDocument()
  })

  it('deactivates and activates a promo', async () => {
    render(<AdminPromosPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar Semana de manos' }))
    await waitFor(() => expect(mockSetActive).toHaveBeenCalledWith('p1', false))
    fireEvent.click(await screen.findByRole('button', { name: 'Activar Semana de manos' }))
    await waitFor(() => expect(mockSetActive).toHaveBeenCalledWith('p1', true))
  })

  it('asks before deleting and keeps the promo when cancelled (edge case)', async () => {
    render(<AdminPromosPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar Semana de manos' }))
    expect(screen.getByText(/conservan su descuento/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(mockDelete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Semana de manos' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' }).at(-1)!)
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('p1'))
    expect(await screen.findByText('Promo eliminada.')).toBeInTheDocument()
  })
})
