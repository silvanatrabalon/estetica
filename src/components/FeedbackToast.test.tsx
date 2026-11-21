import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { FeedbackToast } from './FeedbackToast'

describe('FeedbackToast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('renders nothing without a message', () => {
    const { container } = render(<FeedbackToast onDismiss={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('announces success politely and dismisses it after the delay', () => {
    const onDismiss = vi.fn()
    render(<FeedbackToast success="Guardado" onDismiss={onDismiss} successDurationMs={3000} />)

    expect(screen.getByRole('status')).toHaveTextContent('Guardado')
    act(() => {
      vi.advanceTimersByTime(2999)
    })
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('announces errors as an alert and never auto-dismisses them (edge case)', () => {
    const onDismiss = vi.fn()
    render(<FeedbackToast error="No se pudo guardar" onDismiss={onDismiss} />)

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar')
    act(() => {
      vi.advanceTimersByTime(60000)
    })
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('shows the error when both messages are present (edge case)', () => {
    render(<FeedbackToast success="ok" error="mal" onDismiss={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('mal')
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('can be closed by hand', () => {
    const onDismiss = vi.fn()
    render(<FeedbackToast error="mal" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('does not fire a stale timer after unmount (edge case)', () => {
    const onDismiss = vi.fn()
    const { unmount } = render(<FeedbackToast success="ok" onDismiss={onDismiss} />)
    unmount()
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(onDismiss).not.toHaveBeenCalled()
  })
})
