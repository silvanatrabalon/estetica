import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CouponImageModal } from './CouponImageModal'

const mockPng = vi.fn()
const mockDownload = vi.fn()
const mockLoadMark = vi.fn()
const MARK = { viewBox: '0 0 100 60', width: 100, height: 60, inner: '<path id="sbmark" d="M0 0"/>' }
vi.mock('../../lib/couponImage', async () => {
  const actual = await vi.importActual<typeof import('../../lib/couponImage')>('../../lib/couponImage')
  return {
    ...actual,
    svgToPngBlob: (...a: unknown[]) => mockPng(...a),
    downloadBlob: (...a: unknown[]) => mockDownload(...a),
  }
})
vi.mock('../../lib/brandMark', async () => {
  const actual = await vi.importActual<typeof import('../../lib/brandMark')>('../../lib/brandMark')
  return { ...actual, loadBrandMark: (...a: unknown[]) => mockLoadMark(...a) }
})

const coupon = {
  code: 'VERANO20',
  discountType: 'percent' as const,
  discountValue: 20,
  scope: 'Todos los servicios',
  validity: 'Válido hasta el 31 dic 2026',
  businessName: 'Estética So Beauty',
}

function open(props: Partial<React.ComponentProps<typeof CouponImageModal>> = {}) {
  const onClose = vi.fn()
  render(<CouponImageModal isOpen coupon={coupon} onClose={onClose} {...props} />)
  return onClose
}

describe('CouponImageModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPng.mockResolvedValue(new Blob(['png']))
    mockLoadMark.mockResolvedValue(MARK)
  })

  it('renders nothing when closed or without a coupon (edge case)', () => {
    const { container, rerender } = render(<CouponImageModal isOpen={false} coupon={coupon} onClose={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<CouponImageModal isOpen coupon={null} onClose={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a preview with the base theme and the list of themes', () => {
    open()
    expect(screen.getByRole('dialog', { name: 'Imagen del cupón VERANO20' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Base' })).toBeChecked()
    for (const label of ['Navidad', 'Año nuevo', 'Black Friday', 'Cyber Monday', 'Día de la madre', 'Día de la mujer']) {
      expect(screen.getByRole('radio', { name: label })).toBeInTheDocument()
    }
    const img = screen.getByRole('img') as HTMLImageElement
    expect(img.src).toContain('data:image/svg+xml')
    expect(decodeURIComponent(img.src)).toContain('VERANO20')
  })

  it('draws the SB mark in the image', async () => {
    open()
    await waitFor(() => expect(decodeURIComponent((screen.getByRole('img') as HTMLImageElement).src)).toContain('id="sbmark"'))
  })

  it('goes without the logo when the file cannot be read (edge case)', async () => {
    mockLoadMark.mockResolvedValue(null)
    open()
    await waitFor(() => expect(mockLoadMark).toHaveBeenCalled())
    expect(decodeURIComponent((screen.getByRole('img') as HTMLImageElement).src)).not.toContain('sbmark')
  })

  it('does not load the mark while closed (edge case)', () => {
    render(<CouponImageModal isOpen={false} coupon={coupon} onClose={vi.fn()} />)
    expect(mockLoadMark).not.toHaveBeenCalled()
  })

  it('changing the theme changes the preview', () => {
    open()
    const before = (screen.getByRole('img') as HTMLImageElement).src
    fireEvent.click(screen.getByRole('radio', { name: 'Black Friday' }))
    const after = (screen.getByRole('img') as HTMLImageElement).src
    expect(after).not.toBe(before)
    expect(decodeURIComponent(after)).toContain('BLACK FRIDAY')
  })

  it('downloads the PNG with the code and theme in the name', async () => {
    open()
    fireEvent.click(screen.getByRole('radio', { name: 'Navidad' }))
    fireEvent.click(screen.getByRole('button', { name: 'Descargar imagen' }))
    await waitFor(() => expect(mockDownload).toHaveBeenCalled())
    expect(mockDownload.mock.calls[0][1]).toBe('cupon-verano20-navidad.png')
    expect(mockPng.mock.calls[0][0]).toContain('NAVIDAD')
  })

  it('only offers the image, no SVG download', () => {
    open()
    expect(screen.getByRole('button', { name: 'Descargar imagen' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /SVG/ })).toBeNull()
  })

  it('says so when the browser cannot make the image (edge case)', async () => {
    mockPng.mockRejectedValue(new Error('canvas-unavailable'))
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Descargar imagen' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos generar la imagen')
    expect(mockDownload).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Descargar imagen' })).toBeEnabled()
  })

  it('closes with the button and with Escape (edge case)', () => {
    const onClose = open()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
