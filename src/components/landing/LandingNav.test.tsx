import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LandingNav } from './LandingNav'

const links = [
  { label: 'Servicios', href: '#servicios' },
  { label: 'Contacto', href: '#contacto' },
]

function renderNav(props: Partial<React.ComponentProps<typeof LandingNav>> = {}) {
  return render(
    <MemoryRouter>
      <LandingNav name="Estética So Beauty" logoUrl="https://cdn/logo.svg" links={links} bookHref="/booking" {...props} />
    </MemoryRouter>,
  )
}

describe('LandingNav', () => {
  it('shows the name, the section links and a Reservar button to the booking', () => {
    renderNav()
    expect(screen.getByText('Estética So Beauty')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Servicios' })[0]).toHaveAttribute('href', '#servicios')
    expect(screen.getByRole('link', { name: 'Reservar' })).toHaveAttribute('href', '/booking')
  })

  it('shows the logo as it is, with no box around it', () => {
    const { container } = renderNav()
    const logo = container.querySelector('img') as HTMLImageElement
    expect(logo).toHaveAttribute('src', 'https://cdn/logo.svg')
    expect(logo.className).toContain('object-contain')
    expect(logo.className).not.toMatch(/\bbg-/)
  })

  it('works without a logo or a name (edge case)', () => {
    const { container } = renderNav({ logoUrl: null, name: null })
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByRole('link', { name: 'Reservar' })).toBeInTheDocument()
  })

  it('drops the logo when the image fails to load (edge case)', () => {
    const { container } = renderNav()
    fireEvent.error(container.querySelector('img') as HTMLImageElement)
    expect(container.querySelector('img')).toBeNull()
  })

  it('has no Reservar button when it is null, for admin and staff looking at the site (edge case)', () => {
    renderNav({ bookHref: null })
    expect(screen.queryByRole('link', { name: 'Reservar' })).toBeNull()
  })

  it('the menu button opens the links on phones, and choosing one or pressing Escape closes it', () => {
    renderNav()
    expect(document.getElementById('landing-menu')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    const menu = document.getElementById('landing-menu') as HTMLElement
    expect(menu).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.getElementById('landing-menu')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    fireEvent.click(screen.getAllByRole('link', { name: 'Contacto' }).at(-1)!)
    expect(document.getElementById('landing-menu')).toBeNull()
  })
})
