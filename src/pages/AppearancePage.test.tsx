import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

describe('AppearancePage', () => {
  it('shows the title and no tabs nor link to the site', () => {
    render(<AppearancePage />)
    expect(screen.getByRole('heading', { name: 'Apariencia' })).toBeInTheDocument()
    expect(screen.queryByRole('tab')).toBeNull()
    expect(screen.queryByRole('link', { name: /Ir al sitio/ })).toBeNull()
  })

  it('has everything in one page: logo, then the public page content, then the social links', () => {
    render(<AppearancePage />)
    const brand = screen.getByTestId('brand-panel')
    const landing = screen.getByTestId('landing-panel')
    const social = screen.getByTestId('social-panel')
    expect(brand.compareDocumentPosition(landing) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(landing.compareDocumentPosition(social) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('has no Marca, Sitio web nor Redes tabs (edge case)', () => {
    render(<AppearancePage />)
    for (const name of ['Marca', 'Sitio web', 'Redes']) {
      expect(screen.queryByRole('tab', { name })).toBeNull()
    }
  })
})
