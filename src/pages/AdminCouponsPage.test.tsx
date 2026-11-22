import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AdminCouponsPage } from './AdminCouponsPage'

const mockList = vi.fn()
const mockSave = vi.fn()
const mockSetActive = vi.fn()
const mockDelete = vi.fn()
const mockCategories = vi.fn()

vi.mock('../services/adminCoupons', () => ({
  adminListCoupons: (...a: unknown[]) => mockList(...a),
  adminSaveCoupon: (...a: unknown[]) => mockSave(...a),
  adminSetCouponActive: (...a: unknown[]) => mockSetActive(...a),
  adminDeleteCoupon: (...a: unknown[]) => mockDelete(...a),
}))
vi.mock('../services/businessSettings', () => ({
  getBusinessSettings: () => Promise.resolve({ name: 'Estética So Beauty', logoUrl: 'data:image/png;base64,LOGO' }),
}))
vi.mock('../services/adminCategories', () => ({
  adminListCategories: (...a: unknown[]) => mockCategories(...a),
}))

const coupon = {
  id: 'c1',
  code: 'VERANO10',
  description: 'Descuento de verano',
  discountType: 'percent' as const,
  discountValue: 10,
  categoryId: null,
  categoryName: null,
  startsOn: '2026-06-01',
  endsOn: '2026-12-31',
  isActive: true,
  showOnSite: true,
  timesUsed: 2,
}

function fillDatesIfEmpty() {
  const from = screen.getByLabelText('Desde') as HTMLInputElement
  const to = screen.getByLabelText('Hasta') as HTMLInputElement
  if (!from.value) fireEvent.change(from, { target: { value: '2026-06-01' } })
  if (!to.value) fireEvent.change(to, { target: { value: '2026-12-31' } })
}

function fillDates(from = '2026-06-01', to = '2026-12-31') {
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: from } })
  fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: to } })
}

async function openForm() {
  fireEvent.click(await screen.findByRole('button', { name: '+ Nuevo cupón' }))
}

describe('AdminCouponsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockList.mockResolvedValue([coupon])
    mockCategories.mockResolvedValue([{ id: 'cat-1', name: 'Uñas', displayOrder: 0 }])
    mockSave.mockResolvedValue(undefined)
  })

  it('lists coupons with discount, validity, usage and flags', async () => {
    render(<AdminCouponsPage />)
    expect(await screen.findByText('VERANO10')).toBeInTheDocument()
    expect(screen.getByText('10% OFF')).toBeInTheDocument()
    expect(screen.getByText(/Del .* al /)).toBeInTheDocument()
    expect(screen.getByText(/2 usos/)).toBeInTheDocument()
    expect(screen.getByText('Público · en el sitio web')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
  })

  it('a private coupon says so, and a new coupon starts private (edge case)', async () => {
    mockList.mockResolvedValue([{ ...coupon, showOnSite: false }])
    render(<AdminCouponsPage />)
    expect(await screen.findByText('Privado · solo con el código')).toBeInTheDocument()
    expect(screen.queryByText('Público · en el sitio web')).toBeNull()
    await openForm()
    expect(screen.getByRole('radio', { name: /Privado/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Público/ })).not.toBeChecked()
  })

  it('chooses Público or Privado with an explanation of each', async () => {
    render(<AdminCouponsPage />)
    await openForm()
    expect(screen.getByText('¿Quién puede ver este cupón?')).toBeInTheDocument()
    expect(screen.getByText(/lo ve cualquiera/)).toBeInTheDocument()
    expect(screen.getByText(/solo lo usa quien reciba el código/)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'AMIGA' } })
    fireEvent.change(screen.getByLabelText('Porcentaje (%)'), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('radio', { name: /Público/ }))
    fillDatesIfEmpty()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ showOnSite: true })))
  })

  it('opens the image of a coupon with its data, to pick a theme and download', async () => {
    mockList.mockResolvedValue([{ ...coupon, categoryName: 'Uñas' }])
    render(<AdminCouponsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Descargar imagen del cupón VERANO10' }))
    expect(screen.getByRole('dialog', { name: 'Imagen del cupón VERANO10' })).toBeInTheDocument()
    const preview = decodeURIComponent((screen.getByRole('img') as HTMLImageElement).src)
    expect(preview).toContain('VERANO10')
    expect(preview).toContain('10%')
    expect(preview).toContain('Categoría Uñas')
    expect(preview).toContain('Válido del')
    await waitFor(() => expect(decodeURIComponent((screen.getByRole('img') as HTMLImageElement).src)).toContain('Estética So Beauty'))
    await waitFor(() => expect(decodeURIComponent((screen.getByRole('img') as HTMLImageElement).src)).toContain('<image'))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog', { name: 'Imagen del cupón VERANO10' })).toBeNull()
  })

  it('copies the code to the clipboard with an icon next to the code and confirms it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<AdminCouponsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Copiar código VERANO10' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('VERANO10'))
    expect(await screen.findByRole('button', { name: 'Código VERANO10 copiado' })).toBeInTheDocument()
    expect(screen.queryByText('Copiar código')).toBeNull() // an icon, not a text link
  })

  it('tells the code to copy by hand when the browser refuses (edge case)', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    })
    document.execCommand = vi.fn().mockReturnValue(false)
    render(<AdminCouponsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Copiar código VERANO10' }))
    expect(await screen.findByText(/No pudimos copiar el código\. Copialo a mano: VERANO10/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Código VERANO10 copiado' })).toBeNull()
  })

  it('shows an empty state when there are no coupons (edge case)', async () => {
    mockList.mockResolvedValue([])
    render(<AdminCouponsPage />)
    expect(await screen.findByText('Todavía no creaste cupones')).toBeInTheDocument()
  })

  it('shows an error when the list cannot be loaded (edge case)', async () => {
    mockList.mockRejectedValue(new Error('down'))
    render(<AdminCouponsPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar los cupones')
  })

  it('creates a percentage coupon with the code normalized', async () => {
    render(<AdminCouponsPage />)
    await openForm()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'invierno15' } })
    fireEvent.change(screen.getByLabelText('Porcentaje (%)'), { target: { value: '15' } })
    fillDatesIfEmpty()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: null,
          code: 'INVIERNO15',
          discountType: 'percent',
          discountValue: 15,
          categoryId: null,
          startsOn: '2026-06-01',
          endsOn: '2026-12-31',
          isActive: true,
          showOnSite: false,
        }),
      ),
    )
    expect(await screen.findByText('Cupón creado.')).toBeInTheDocument()
  })

  it('a fixed amount is sent in cents', async () => {
    render(<AdminCouponsPage />)
    await openForm()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'PESOS' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Monto fijo' }))
    fireEvent.change(screen.getByLabelText('Monto a descontar ($)'), { target: { value: '500' } })
    fillDatesIfEmpty()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() =>
      expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ discountType: 'fixed', discountValue: 50000 })),
    )
  })

  it('limits the coupon to a category', async () => {
    render(<AdminCouponsPage />)
    await openForm()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'UNIAS' } })
    fireEvent.change(screen.getByLabelText('Porcentaje (%)'), { target: { value: '20' } })
    fireEvent.click(screen.getByRole('button', { name: /Aplica a/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Categoría: Uñas' }))
    fillDatesIfEmpty()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'cat-1' })))
  })

  it('validates the code, the value and the dates before saving (edge cases)', async () => {
    render(<AdminCouponsPage />)
    await openForm()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'ab' } })
    fireEvent.change(screen.getByLabelText('Porcentaje (%)'), { target: { value: '150' } })
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-12-10' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-12-01' } })
    fillDatesIfEmpty()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText(/al menos 3 caracteres/)).toBeInTheDocument()
    expect(screen.getByText(/no puede superar 100/)).toBeInTheDocument()
    expect(screen.getByText(/fecha de fin no puede ser anterior/)).toBeInTheDocument()
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('the validity is a titled section with both dates required, and nothing says optional', async () => {
    render(<AdminCouponsPage />)
    await openForm()
    expect(screen.getByText('Vigencia')).toBeInTheDocument()
    expect(screen.getByLabelText('Desde')).toBeRequired()
    expect(screen.getByLabelText('Hasta')).toBeRequired()
    expect(screen.queryByText('(opcional)')).toBeNull()
  })

  it('does not save without dates and says which one is missing (edge case)', async () => {
    render(<AdminCouponsPage />)
    await openForm()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'SINFECHA' } })
    fireEvent.change(screen.getByLabelText('Porcentaje (%)'), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Elegí desde cuándo vale el cupón.')).toBeInTheDocument()
    expect(screen.getByText('Elegí hasta cuándo vale el cupón.')).toBeInTheDocument()
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('only the missing date is flagged (edge case)', async () => {
    render(<AdminCouponsPage />)
    await openForm()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'MEDIO' } })
    fireEvent.change(screen.getByLabelText('Porcentaje (%)'), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-06-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Elegí hasta cuándo vale el cupón.')).toBeInTheDocument()
    expect(screen.queryByText('Elegí desde cuándo vale el cupón.')).toBeNull()
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('an old coupon without dates must get them when edited (edge case)', async () => {
    mockList.mockResolvedValue([{ ...coupon, startsOn: null, endsOn: null }])
    render(<AdminCouponsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('Elegí desde cuándo vale el cupón.')).toBeInTheDocument()
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('shows the database error and keeps the form open when the code is taken (edge case)', async () => {
    mockSave.mockRejectedValue(new Error('Ya existe un cupón con ese código.'))
    render(<AdminCouponsPage />)
    await openForm()
    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'VERANO10' } })
    fireEvent.change(screen.getByLabelText('Porcentaje (%)'), { target: { value: '10' } })
    fillDatesIfEmpty()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe un cupón con ese código.')
    expect(screen.getByLabelText('Código')).toBeInTheDocument()
  })

  it('edits an existing coupon with its values loaded', async () => {
    render(<AdminCouponsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    expect((screen.getByLabelText('Código') as HTMLInputElement).value).toBe('VERANO10')
    expect((screen.getByLabelText('Porcentaje (%)') as HTMLInputElement).value).toBe('10')
    fillDatesIfEmpty()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1' })))
  })

  it('loads a fixed coupon back in pesos, not cents (edge case)', async () => {
    mockList.mockResolvedValue([{ ...coupon, discountType: 'fixed', discountValue: 50000 }])
    render(<AdminCouponsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }))
    expect((screen.getByLabelText('Monto a descontar ($)') as HTMLInputElement).value).toBe('500')
  })

  it('activates and deactivates', async () => {
    mockSetActive.mockResolvedValue(undefined)
    render(<AdminCouponsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar' }))
    await waitFor(() => expect(mockSetActive).toHaveBeenCalledWith('c1', false))
    expect(await screen.findByText('VERANO10 fue desactivado.')).toBeInTheDocument()
  })

  it('deleting asks for confirmation and warns when the coupon was already used', async () => {
    mockDelete.mockResolvedValue('deactivated')
    render(<AdminCouponsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    expect(screen.getByText(/ya se usó 2 veces/)).toBeInTheDocument()
    const dialog = screen.getByRole('dialog')
    fireEvent.click(Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Desactivar')!)
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('c1'))
    expect(await screen.findByText(/ya se usó, así que se desactivó/)).toBeInTheDocument()
  })

  it('an unused coupon is deleted after confirming (edge case)', async () => {
    mockList.mockResolvedValue([{ ...coupon, timesUsed: 0 }])
    mockDelete.mockResolvedValue('deleted')
    render(<AdminCouponsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.click(Array.from(dialog.querySelectorAll('button')).find((b) => b.textContent === 'Eliminar')!)
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('c1'))
    expect(await screen.findByText('VERANO10 fue eliminado.')).toBeInTheDocument()
  })

  it('cancelling the confirmation deletes nothing (edge case)', async () => {
    render(<AdminCouponsPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(mockDelete).not.toHaveBeenCalled()
  })
})
