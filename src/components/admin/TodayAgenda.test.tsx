import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TodayAgenda } from './TodayAgenda'
import type { AgendaItem } from '../../lib/todayAgenda'

const TZ = 'America/Argentina/Buenos_Aires'
const NOW = new Date('2026-11-21T13:18:00Z') // 10:18

function item(id: string, start: string, end: string, status: string, name: string, service: string): AgendaItem {
  return { id, startsAt: start, endsAt: end, status, customerName: name, serviceName: service, staffDisplayName: 'Sil' }
}

const done = item('1', '2026-11-21T12:00:00Z', '2026-11-21T13:00:00Z', 'completed', 'Laura Gómez', 'Belleza de pies')
const nextOne = item('2', '2026-11-21T13:30:00Z', '2026-11-21T14:30:00Z', 'confirmed', 'Camila Ríos', 'Semi permanentes')
const pending = item('3', '2026-11-21T19:30:00Z', '2026-11-21T20:30:00Z', 'pending', 'Sofía Benítez', 'Belleza de pies')
const items = [done, nextOne, pending]

function renderAgenda(props: Partial<React.ComponentProps<typeof TodayAgenda>> = {}) {
  return render(
    <MemoryRouter>
      <TodayAgenda items={items} featured={[nextOne]} timezone={TZ} now={NOW} loading={false} error={null} {...props} />
    </MemoryRouter>,
  )
}

describe('TodayAgenda', () => {
  it('shows the next appointment with its time, client, service and how soon it starts', () => {
    renderAgenda()
    expect(screen.getByRole('heading', { name: 'Siguiente turno de hoy' })).toBeInTheDocument()
    const card = screen.getByRole('heading', { name: 'Siguiente turno de hoy' }).parentElement!
    expect(within(card).getByText('10:30')).toBeInTheDocument()
    expect(within(card).getByText('en 12 min')).toBeInTheDocument()
    expect(within(card).getByText('Camila Ríos')).toBeInTheDocument()
    expect(within(card).getByText('Semi permanentes · con Sil')).toBeInTheDocument()
  })

  it('shows one card per appointment in progress or next, with a plural heading (edge case)', () => {
    const other = item('4', '2026-11-21T13:30:00Z', '2026-11-21T14:00:00Z', 'confirmed', 'Rosa Pérez', 'Perfilado de cejas')
    renderAgenda({ items: [done, nextOne, other, pending], featured: [nextOne, other] })
    expect(screen.getByRole('heading', { name: 'Ahora y siguientes' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Siguiente turno de hoy' })).toBeNull()
    expect(screen.getByText('Camila Ríos')).toBeInTheDocument()
    expect(screen.getByText('Rosa Pérez')).toBeInTheDocument()
    expect(screen.queryByText('Laura Gómez')).toBeNull() // done: not featured
  })

  it('does not list the whole day, only the featured cards', () => {
    renderAgenda()
    expect(screen.queryByRole('heading', { name: /^Hoy ·/ })).toBeNull()
    expect(screen.queryByText('Sofía Benítez')).toBeNull()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('says there are no turns today and promises where they will appear (edge case)', () => {
    renderAgenda({ items: [], featured: [] })
    expect(screen.getByText('Hoy no tenés turnos.')).toBeInTheDocument()
    expect(screen.getByText(/lo vas a ver acá/)).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('says the day is over when every turn has passed (edge case)', () => {
    renderAgenda({ items: [done], featured: [] })
    expect(screen.getByText('No quedan turnos por hoy.')).toBeInTheDocument()
  })

  it('shows a busy placeholder while loading (edge case)', () => {
    renderAgenda({ loading: true })
    expect(screen.getByLabelText('Turnos de hoy')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('heading', { name: 'Siguiente turno de hoy' })).toBeNull()
  })

  it('shows the error as an alert and no list (edge case)', () => {
    renderAgenda({ error: 'No pudimos cargar los turnos de hoy.' })
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar los turnos de hoy.')
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('keeps a long client name fully visible instead of truncating it (edge case)', () => {
    const long = item('9', '2026-11-21T13:30:00Z', '2026-11-21T14:30:00Z', 'confirmed', 'María de los Ángeles Fernández de Kirchner', 'Semi permanentes')
    renderAgenda({ items: [long], featured: [long] })
    expect(screen.getByText('María de los Ángeles Fernández de Kirchner').className).not.toContain('truncate')
  })

  describe('links to the appointment', () => {
    const href = (id: string) => `/admin/appointments/${id}`

    it('without detailHref nothing is a link', () => {
      renderAgenda()
      expect(screen.queryAllByRole('link')).toHaveLength(0)
    })

    it('each card links to its appointment, covering the whole card', () => {
      const other = item('4', '2026-11-21T13:30:00Z', '2026-11-21T14:00:00Z', 'confirmed', 'Rosa Pérez', 'Perfilado de cejas')
      renderAgenda({ detailHref: href, featured: [nextOne, other] })
      const first = screen.getByRole('link', { name: 'Camila Ríos' })
      expect(first).toHaveAttribute('href', '/admin/appointments/2')
      expect(screen.getByRole('link', { name: 'Rosa Pérez' })).toHaveAttribute('href', '/admin/appointments/4')
      expect(first.className).toContain('after:absolute')
      expect(first.className).toContain('after:inset-0')
    })

    it('without featured cards there is no link (edge case)', () => {
      renderAgenda({ detailHref: href, featured: [] })
      expect(screen.queryAllByRole('link')).toHaveLength(0)
    })
  })
})
