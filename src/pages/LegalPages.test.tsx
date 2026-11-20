import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PrivacyPage, TermsPage } from './LegalPages'

function renderPage(page: JSX.Element) {
  return render(<MemoryRouter>{page}</MemoryRouter>)
}

describe('Legal pages', () => {
  it('renders the privacy policy without requiring authentication', () => {
    renderPage(<PrivacyPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Política de privacidad' })).toBeDefined()
    expect(screen.getByText(/Última actualización/)).toBeDefined()
  })

  it('renders the terms of service without requiring authentication', () => {
    renderPage(<TermsPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Condiciones del servicio' })).toBeDefined()
  })

  it.each([
    ['privacy', <PrivacyPage key="p" />],
    ['terms', <TermsPage key="t" />],
  ])('%s page links back to the landing page', (_name, page) => {
    renderPage(page)

    const back = screen.getByRole('link', { name: /Volver al inicio/ })
    expect(back.getAttribute('href')).toBe('/')
  })
})
