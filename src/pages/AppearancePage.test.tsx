import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppearancePage } from './AppearancePage'

vi.mock('../components/appearance/BrandSettingsForm', () => ({
  BrandSettingsForm: () => <div data-testid="brand-panel" />,
}))
vi.mock('../components/landing/SocialLinksEditor', () => ({
  SocialLinksEditor: () => <div data-testid="social-panel" />,
}))
vi.mock('./LandingConfigPage', () => ({
  LandingConfigPage: () => <div data-testid="landing-panel" />,
}))

function isVisible(testId: string) {
  return !screen.getByTestId(testId).parentElement!.hasAttribute('hidden')
}

describe('AppearancePage', () => {
  it('shows the title, a link to the public page and the two tabs', () => {
    render(<AppearancePage />)
    expect(screen.getByRole('heading', { name: 'Apariencia' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ir al sitio web/ })).toHaveAttribute('href', '/')
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Marca y reservas', 'Página pública'])
  })

  it('opens on the brand tab', () => {
    render(<AppearancePage />)
    expect(isVisible('brand-panel')).toBe(true)
    expect(isVisible('landing-panel')).toBe(false)
    expect(isVisible('social-panel')).toBe(false)
  })

  it('shows the social links inside the Página pública tab, after the page content', () => {
    render(<AppearancePage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Página pública' }))

    expect(isVisible('landing-panel')).toBe(true)
    expect(isVisible('social-panel')).toBe(true)
    expect(isVisible('brand-panel')).toBe(false)

    const landing = screen.getByTestId('landing-panel')
    const social = screen.getByTestId('social-panel')
    expect(landing.parentElement).toBe(social.parentElement)
    expect(landing.compareDocumentPosition(social) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('has no separate Redes tab (edge case)', () => {
    render(<AppearancePage />)
    expect(screen.queryByRole('tab', { name: 'Redes' })).toBeNull()
  })

  it('hides social links on the brand tab (edge case)', () => {
    render(<AppearancePage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Página pública' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Marca y reservas' }))
    expect(isVisible('social-panel')).toBe(false)
    expect(isVisible('brand-panel')).toBe(true)
  })

  it('keeps every panel mounted so unsaved edits survive switching tabs (edge case)', () => {
    render(<AppearancePage />)
    fireEvent.click(screen.getByRole('tab', { name: 'Página pública' }))
    expect(screen.getByTestId('brand-panel')).toBeInTheDocument()
    expect(screen.getByTestId('social-panel')).toBeInTheDocument()
  })
})
