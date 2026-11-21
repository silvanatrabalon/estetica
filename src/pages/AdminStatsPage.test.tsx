import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AdminStatsPage } from './AdminStatsPage'

const mockGetStats = vi.fn()
vi.mock('../services/adminStats', () => ({ getAdminStats: (...a: unknown[]) => mockGetStats(...a) }))

const stats = {
  totals: { services: 8, revenueCents: 1500000, clients: 3 },
  professionals: [
    { staffMemberId: 's1', displayName: 'Sil', services: 5, revenueCents: 1000000 },
    { staffMemberId: 's2', displayName: 'Marta', services: 3, revenueCents: 500000 },
  ],
  months: [
    { month: '2026-10', services: 2, revenueCents: 400000 },
    { month: '2026-11', services: 6, revenueCents: 1100000 },
  ],
  clients: [
    { customerUserId: 'u1', name: 'Ana Pérez', visits: 4, spentCents: 800000 },
    { customerUserId: 'u2', name: 'Lucía', visits: 1, spentCents: 100000 },
  ],
}

describe('AdminStatsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetStats.mockResolvedValue(stats)
  })

  it('shows the totals, income per month, services per professional and loyal clients', async () => {
    render(<AdminStatsPage />)
    expect(await screen.findByText('Sil')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText(/15\.000/)).toBeInTheDocument()
    expect(screen.getByText('5 servicios')).toBeInTheDocument()
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('4 visitas')).toBeInTheDocument()
    expect(screen.getByText('1 visita')).toBeInTheDocument()
    expect(screen.getByLabelText('Ingresos brutos de los últimos 12 meses')).toBeInTheDocument()
    expect(screen.getByText(/nov 2026: .*11\.000/)).toBeInTheDocument()
  })

  it('starts on "Este mes" and asks for a month range', async () => {
    render(<AdminStatsPage />)
    await screen.findByText('Sil')
    expect(screen.getByRole('tab', { name: 'Este mes' })).toHaveAttribute('aria-selected', 'true')
    const [from, to] = mockGetStats.mock.calls[0]
    expect(from).toMatch(/^\d{4}-\d{2}-01$/)
    expect(to > from).toBe(true)
  })

  it('changing the period asks again, "Todo" without bounds', async () => {
    render(<AdminStatsPage />)
    await screen.findByText('Sil')
    fireEvent.click(screen.getByRole('tab', { name: 'Todo' }))
    await waitFor(() => expect(mockGetStats).toHaveBeenLastCalledWith(null, null))
  })

  it('says so when nothing happened in the period (edge case)', async () => {
    mockGetStats.mockResolvedValue({
      totals: { services: 0, revenueCents: 0, clients: 0 },
      professionals: [{ staffMemberId: 's1', displayName: 'Sil', services: 0, revenueCents: 0 }],
      months: [],
      clients: [],
    })
    render(<AdminStatsPage />)
    expect(await screen.findByText('Todavía no hay servicios realizados en este período.')).toBeInTheDocument()
    expect(screen.getByText('Todavía no hay visitas en este período.')).toBeInTheDocument()
  })

  it('shows an error when the numbers cannot be loaded (edge case)', async () => {
    mockGetStats.mockRejectedValue(new Error('down'))
    render(<AdminStatsPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar las estadísticas')
  })

  it('explains that only past appointments count', async () => {
    render(<AdminStatsPage />)
    expect(await screen.findByText(/Cuentan los turnos que ya se realizaron/)).toBeInTheDocument()
  })
})
