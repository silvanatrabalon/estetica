import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SocialLinksEditor } from './SocialLinksEditor'

const mockGetSocialLinks = vi.fn()
const mockSaveSocialLinks = vi.fn()

vi.mock('../../services/socialLinks', () => ({
  getSocialLinks: (...args: unknown[]) => mockGetSocialLinks(...args),
  saveSocialLinks: (...args: unknown[]) => mockSaveSocialLinks(...args),
}))

describe('SocialLinksEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSocialLinks.mockResolvedValue([])
  })

  it('lists every network, all shown by default', async () => {
    render(<SocialLinksEditor />)

    for (const label of ['Instagram', 'WhatsApp', 'Facebook', 'TikTok', 'YouTube', 'X (Twitter)', 'Sitio web']) {
      const checkbox = (await screen.findByLabelText(`Mostrar ${label}`)) as HTMLInputElement
      expect(checkbox.checked).toBe(true)
    }
  })

  it('loads stored values and the hidden state', async () => {
    mockGetSocialLinks.mockResolvedValue([
      { network: 'instagram', value: 'https://instagram.com/sil', enabled: true },
      { network: 'facebook', value: 'https://facebook.com/sil', enabled: false },
    ])
    render(<SocialLinksEditor />)

    await waitFor(() => {
      expect((screen.getByLabelText(/Instagram \(URL\)/) as HTMLInputElement).value).toBe('https://instagram.com/sil')
    })
    expect((screen.getByLabelText('Mostrar Facebook') as HTMLInputElement).checked).toBe(false)
  })

  it('saves values and the show/hide choice', async () => {
    mockSaveSocialLinks.mockResolvedValue(undefined)
    render(<SocialLinksEditor />)

    fireEvent.change(await screen.findByLabelText(/Instagram \(URL\)/), { target: { value: 'instagram.com/sil' } })
    fireEvent.change(screen.getByLabelText(/WhatsApp \(número/), { target: { value: '+54 9 11 1234-5678' } })
    fireEvent.click(screen.getByLabelText('Mostrar WhatsApp'))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar redes' }))

    await waitFor(() => expect(mockSaveSocialLinks).toHaveBeenCalled())
    const saved = mockSaveSocialLinks.mock.calls[0][0] as Array<{ network: string; value: string; enabled: boolean }>
    expect(saved).toHaveLength(7)
    expect(saved.find((l) => l.network === 'instagram')).toEqual({ network: 'instagram', value: 'instagram.com/sil', enabled: true })
    expect(saved.find((l) => l.network === 'whatsapp')).toEqual({ network: 'whatsapp', value: '+54 9 11 1234-5678', enabled: false })
    expect(await screen.findByText('Redes sociales guardadas correctamente.')).toBeDefined()
    expect((screen.getByLabelText(/Instagram \(URL\)/) as HTMLInputElement).value).toBe('https://instagram.com/sil')
  })

  it('shows an error and saves nothing for an invalid URL (edge case)', async () => {
    render(<SocialLinksEditor />)

    fireEvent.change(await screen.findByLabelText(/Sitio web \(URL\)/), { target: { value: 'javascript:alert(1)' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar redes' }))

    expect(await screen.findByText('Ingresá una URL válida para Sitio web.')).toBeDefined()
    expect(mockSaveSocialLinks).not.toHaveBeenCalled()
  })

  it('rejects a WhatsApp value without enough digits (edge case)', async () => {
    render(<SocialLinksEditor />)

    fireEvent.change(await screen.findByLabelText(/WhatsApp \(número/), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar redes' }))

    expect(await screen.findByText(/número de WhatsApp válido/)).toBeDefined()
    expect(mockSaveSocialLinks).not.toHaveBeenCalled()
  })

  it('shows a save error when the request fails (edge case)', async () => {
    mockSaveSocialLinks.mockRejectedValue(new Error('boom'))
    render(<SocialLinksEditor />)

    fireEvent.click(await screen.findByRole('button', { name: 'Guardar redes' }))

    expect(await screen.findByText('No pudimos guardar las redes sociales. Intentá nuevamente.')).toBeDefined()
  })

  it('still renders when loading the links fails (edge case)', async () => {
    mockGetSocialLinks.mockRejectedValue(new Error('down'))
    render(<SocialLinksEditor />)

    expect(((await screen.findByLabelText(/Instagram \(URL\)/)) as HTMLInputElement).value).toBe('')
  })
})
