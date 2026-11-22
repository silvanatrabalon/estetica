import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { EditPopup, SectionCard } from './SectionCard'

describe('SectionCard', () => {
  it('shows the title, the summary and an Editar that opens the section', () => {
    const onEdit = vi.fn()
    render(
      <SectionCard title="Logo" description="Se ve arriba" onEdit={onEdit}>
        <span>mi-logo.png</span>
      </SectionCard>,
    )
    expect(screen.getByRole('heading', { name: 'Logo' })).toBeInTheDocument()
    expect(screen.getByText('mi-logo.png')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Logo' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('works without description nor summary (edge case)', () => {
    render(<SectionCard title="Vacía" onEdit={() => {}} />)
    expect(screen.getByRole('button', { name: 'Editar Vacía' })).toBeInTheDocument()
  })
})

describe('EditPopup', () => {
  it('is a dialog that saves with Guardar and closes with Cancelar or Escape', () => {
    const onSubmit = vi.fn()
    const onClose = vi.fn()
    render(
      <EditPopup title="Editar logo" onSubmit={onSubmit} onClose={onClose}>
        <input aria-label="x" />
      </EditPopup>,
    )
    expect(screen.getByRole('dialog', { name: 'Editar logo' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('shows the error inside and does not close while saving (edge case)', () => {
    const onClose = vi.fn()
    render(
      <EditPopup title="T" onSubmit={() => {}} onClose={onClose} isSaving error="No se pudo">
        <p>c</p>
      </EditPopup>,
    )
    expect(screen.getByRole('dialog')).toContainElement(screen.getByRole('alert'))
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('without onSubmit it only has Listo (edge case)', () => {
    const onClose = vi.fn()
    render(
      <EditPopup title="Carrusel" onClose={onClose}>
        <p>c</p>
      </EditPopup>,
    )
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
