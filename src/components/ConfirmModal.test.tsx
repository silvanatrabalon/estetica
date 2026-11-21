import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ConfirmModal } from './ConfirmModal'

function setup(props: Partial<React.ComponentProps<typeof ConfirmModal>> = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(<ConfirmModal isOpen message="¿Seguro?" onConfirm={onConfirm} onCancel={onCancel} {...props} />)
  return { onConfirm, onCancel }
}

describe('ConfirmModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ConfirmModal isOpen={false} message="x" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('is an accessible dialog with its title and message', () => {
    setup({ title: 'Cambiar rol' })
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { name: 'Cambiar rol' })).toBeInTheDocument()
    expect(screen.getByText('¿Seguro?')).toBeInTheDocument()
  })

  it('uses the brand colour for a normal confirmation, not a hard-coded blue', () => {
    setup()
    const confirm = screen.getByRole('button', { name: 'Confirmar' })
    expect(confirm.className).toContain('bg-brand-primary')
    expect(confirm.className).not.toContain('blue')
  })

  it('uses red for destructive confirmations and honours custom labels', () => {
    setup({ destructive: true, confirmLabel: 'Eliminar cierre', cancelLabel: 'Volver' })
    expect(screen.getByRole('button', { name: 'Eliminar cierre' }).className).toContain('bg-red-600')
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
  })

  it('calls the right callbacks and focuses Cancel first for safety', () => {
    const { onConfirm, onCancel } = setup()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('Escape cancels (edge case)', () => {
    const { onCancel, onConfirm } = setup()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('ignores Escape while closed (edge case)', () => {
    const onCancel = vi.fn()
    render(<ConfirmModal isOpen={false} message="x" onConfirm={vi.fn()} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).not.toHaveBeenCalled()
  })
})
