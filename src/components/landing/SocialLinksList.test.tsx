import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SocialLinksList } from './SocialLinksList'
import type { SocialLink } from '../../lib/socialLinks'

describe('SocialLinksList', () => {
  it('renders a link per enabled network with the right href', () => {
    const links: SocialLink[] = [
      { network: 'instagram', value: 'https://instagram.com/sil', enabled: true },
      { network: 'whatsapp', value: '5491112345678', enabled: true },
    ]
    render(<SocialLinksList links={links} />)

    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://instagram.com/sil')
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5491112345678')
  })

  it('opens links in a new tab safely', () => {
    render(<SocialLinksList links={[{ network: 'facebook', value: 'https://facebook.com/x', enabled: true }]} />)
    const link = screen.getByRole('link', { name: 'Facebook' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('hides networks that are not enabled (edge case)', () => {
    render(<SocialLinksList links={[{ network: 'tiktok', value: 'https://tiktok.com/@x', enabled: false }]} />)
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('renders nothing for an empty list (edge case)', () => {
    const { container } = render(<SocialLinksList links={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('skips links with an unsafe value instead of rendering them (edge case)', () => {
    render(
      <SocialLinksList
        links={[
          { network: 'website', value: 'javascript:alert(1)', enabled: true },
          { network: 'youtube', value: 'https://youtube.com/@x', enabled: true },
        ]}
      />,
    )
    expect(screen.queryByRole('link', { name: 'Sitio web' })).toBeNull()
    expect(screen.getByRole('link', { name: 'YouTube' })).toBeInTheDocument()
  })

  it('renders in the fixed network order regardless of input order', () => {
    render(
      <SocialLinksList
        links={[
          { network: 'website', value: 'https://a.com', enabled: true },
          { network: 'instagram', value: 'https://instagram.com/a', enabled: true },
        ]}
      />,
    )
    expect(screen.getAllByRole('link').map((l) => l.getAttribute('aria-label'))).toEqual(['Instagram', 'Sitio web'])
  })
})
