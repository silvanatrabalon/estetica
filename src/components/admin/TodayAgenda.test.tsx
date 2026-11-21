import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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
    <TodayAgenda items={items} next={nextOne} timezone={TZ} now={NOW} loading={false} error={null} {...props} />,
  )
}

describe('TodayAgenda', () => {
  it('shows the next appointment with its time, client, service and how soon it starts', () => {
    renderAgenda()
    expect(screen.getByRole('heading', { name: 'Próximo turno' })).toBeInTheDocument()
    const card = screen.getByRole('heading', { name: 'Próximo turno' }).parentElement!
    expect(within(card).getByText('10:30')).toBeInTheDocument()
    expect(within(card).getByText('en 12 min')).toBeInTheDocument()
    expect(within(card).getByText('Camila Ríos')).toBeInTheDocument()
    expect(within(card).getByText('Semi permanentes · con Sil')).toBeInTheDocument()
  })

  it('lists the day in order with a state pill per row and counts the turns', () => {
    renderAgenda()
    expect(screen.getByRole('heading', { name: 'Hoy · 3 turnos' })).toBeInTheDocument()
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(within(rows[0]).getByText('Hecho')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Confirmado')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Pendiente')).toBeInTheDocument()
  })

  it('marks only the next appointment as current', () => {
    renderAgenda()
    const rows = screen.getAllByRole('listitem')
    expect(rows.map((r) => r.getAttribute('aria-current'))).toEqual([null, 'true', null])
  })

  it('uses singular for a single turn (edge case)', () => {
    renderAgenda({ items: [nextOne] })
    expect(screen.getByRole('heading', { name: 'Hoy · 1 turno' })).toBeInTheDocument()
  })

  it('says there are no turns today and promises where they will appear (edge case)', () => {
    renderAgenda({ items: [], next: null })
    expect(screen.getByText('Hoy no tenés turnos.')).toBeInTheDocument()
    expect(screen.getByText(/lo vas a ver acá/)).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('says the day is over when every turn has passed (edge case)', () => {
    renderAgenda({ items: [done], next: null })
    expect(screen.getByText('No quedan turnos por hoy.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Hoy · 1 turno' })).toBeInTheDocument()
  })

  it('shows a busy placeholder while loading (edge case)', () => {
    renderAgenda({ loading: true })
    expect(screen.getByLabelText('Turnos de hoy')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('heading', { name: 'Próximo turno' })).toBeNull()
  })

  it('shows the error as an alert and no list (edge case)', () => {
    renderAgenda({ error: 'No pudimos cargar los turnos de hoy.' })
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar los turnos de hoy.')
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('keeps a long client name fully visible instead of truncating it (edge case)', () => {
    const long = item('9', '2026-11-21T13:30:00Z', '2026-11-21T14:30:00Z', 'confirmed', 'María de los Ángeles Fernández de Kirchner', 'Semi permanentes')
    renderAgenda({ items: [long], next: long })
    const row = screen.getByRole('listitem')
    expect(within(row).getByText('María de los Ángeles Fernández de Kirchner').className).not.toContain('truncate')
  })
})
