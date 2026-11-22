import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WhatsAppButton } from './WhatsAppButton'

describe('WhatsAppButton', () => {
  it('links to WhatsApp with the number the admin set', () => {
    render(<WhatsAppButton links={[{ network: 'whatsapp', value: '+54 9 11 1234-5678', enabled: true }]} />)
    const link = screen.getByRole('link', { name: 'Escribinos por WhatsApp' })
    expect(link.getAttribute('href')).toContain('wa.me/5491112345678')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('shows nothing when WhatsApp is off, empty or invalid, or there are no links (edge cases)', () => {
    const { container, rerender } = render(<WhatsAppButton links={[{ network: 'whatsapp', value: '+54 9 11 1234-5678', enabled: false }]} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<WhatsAppButton links={[{ network: 'whatsapp', value: '', enabled: true }]} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<WhatsAppButton links={[{ network: 'whatsapp', value: '123', enabled: true }]} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<WhatsAppButton links={[{ network: 'instagram', value: 'https://instagram.com/x', enabled: true }]} />)
    expect(container).toBeEmptyDOMElement()
    rerender(<WhatsAppButton links={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
