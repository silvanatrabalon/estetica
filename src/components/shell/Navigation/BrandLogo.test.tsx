import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { BrandLogo } from './BrandLogo'

const mockGetBrand = vi.fn()
vi.mock('../../../services/brand', () => ({
  getBrandSettings: (...a: unknown[]) => mockGetBrand(...a),
}))

describe('BrandLogo', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the logo when the business has one', async () => {
    mockGetBrand.mockResolvedValue({ logoUrl: 'https://x/logo.png', bookingHeaderText: null, bookingSubtitleText: null })
    const { container } = render(<BrandLogo />)
    await waitFor(() => expect(container.querySelector('img')).toHaveAttribute('src', 'https://x/logo.png'))
  })

  it('renders nothing when there is no logo (edge case)', async () => {
    mockGetBrand.mockResolvedValue({ logoUrl: null, bookingHeaderText: null, bookingSubtitleText: null })
    const { container } = render(<BrandLogo />)
    await waitFor(() => expect(mockGetBrand).toHaveBeenCalled())
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders nothing when loading fails (edge case)', async () => {
    mockGetBrand.mockRejectedValue(new Error('down'))
    const { container } = render(<BrandLogo />)
    await waitFor(() => expect(mockGetBrand).toHaveBeenCalled())
    expect(container.querySelector('img')).toBeNull()
  })

  it('hides the logo when the image fails to load (edge case)', async () => {
    mockGetBrand.mockResolvedValue({ logoUrl: 'https://x/broken.png', bookingHeaderText: null, bookingSubtitleText: null })
    const { container } = render(<BrandLogo />)
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull())
    fireEvent.error(container.querySelector('img')!)
    expect(container.querySelector('img')).toBeNull()
  })
})
