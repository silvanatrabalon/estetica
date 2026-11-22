import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ActionButton, ActionRow } from './ActionButton'

describe('ActionButton and ActionRow', () => {
  it('is a button of type "button" with the same size and weight for every tone', () => {
    render(
      <>
        <ActionButton>Editar</ActionButton>
        <ActionButton tone="neutral">Desactivar</ActionButton>
        <ActionButton tone="danger">Eliminar</ActionButton>
      </>,
    )
    for (const name of ['Editar', 'Desactivar', 'Eliminar']) {
      const button = screen.getByRole('button', { name })
      expect(button).toHaveAttribute('type', 'button')
      expect(button.className).toContain('text-xs')
      expect(button.className).toContain('font-semibold')
    }
  })

  it('each tone has its own color: primary, neutral and danger', () => {
    render(
      <>
        <ActionButton>Editar</ActionButton>
        <ActionButton tone="neutral">Desactivar</ActionButton>
        <ActionButton tone="danger">Eliminar</ActionButton>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Editar' }).className).toContain('text-brand-primary')
    expect(screen.getByRole('button', { name: 'Desactivar' }).className).toContain('text-shell-subtleText')
    expect(screen.getByRole('button', { name: 'Eliminar' }).className).toContain('text-red-500')
  })

  it('calls onClick, and a disabled one does not (edge case)', () => {
    const onClick = vi.fn()
    const { rerender } = render(<ActionButton onClick={onClick}>Editar</ActionButton>)
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(
      <ActionButton onClick={onClick} disabled>
        Editar
      </ActionButton>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('keeps extra classes and accessible names (edge case)', () => {
    render(
      <ActionButton aria-label="Editar roles de Ana" className="shrink-0">
        Editar roles
      </ActionButton>,
    )
    const button = screen.getByRole('button', { name: 'Editar roles de Ana' })
    expect(button.className).toContain('shrink-0')
    expect(button.className).toContain('text-brand-primary')
  })

  it('ActionRow lays the actions out in a wrapping row', () => {
    render(
      <ActionRow className="mt-3">
        <ActionButton>Uno</ActionButton>
        <ActionButton>Dos</ActionButton>
      </ActionRow>,
    )
    const row = screen.getByRole('button', { name: 'Uno' }).parentElement!
    expect(row.className).toContain('flex-wrap')
    expect(row.className).toContain('gap-x-4')
    expect(row.className).toContain('mt-3')
  })
})

describe('the screens use the shared action buttons', () => {
  const root = join(__dirname, '..')
  const screens = [
    'pages/AdminUsersPage.tsx',
    'pages/AdminStaffPage.tsx',
    'pages/AdminServicesPage.tsx',
    'pages/AdminCouponsPage.tsx',
    'pages/BusinessSettingsPage.tsx',
    'pages/AdminStaffServicesPage.tsx',
    'components/admin/ServiceAvailabilityModal.tsx',
    'components/availability/ExceptionDateList.tsx',
  ]

  it.each(screens)('%s uses ActionButton', (file) => {
    expect(readFileSync(join(root, file), 'utf8')).toContain('<ActionButton')
  })

  it.each(screens)('%s has no hand-made red or blue action links left (edge case)', (file) => {
    const text = readFileSync(join(root, file), 'utf8')
    expect(text).not.toMatch(/className="[^"]*text-blue-600 hover:text-blue-800[^"]*text-xs/)
    expect(text).not.toMatch(/className="[^"]*text-purple-600 hover:text-purple-800/)
    expect(text).not.toMatch(/className="[^"]*text-teal-700 hover:underline/)
    expect(text).not.toMatch(/className="[^"]*border-red-200[^"]*text-red-(600|700)[^"]*"\s*\n?\s*(onClick|type)/)
  })
})
