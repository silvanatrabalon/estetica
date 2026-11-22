import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyToClipboard } from './clipboard'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('copyToClipboard', () => {
  it('uses the async clipboard when it is there', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    expect(await copyToClipboard('VERANO10')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('VERANO10')
  })

  it('falls back to the legacy copy when the async one fails (edge case)', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      configurable: true,
    })
    document.execCommand = vi.fn().mockReturnValue(true)
    expect(await copyToClipboard('AMIGA')).toBe(true)
    expect(document.execCommand).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull() // the helper cleans up
  })

  it('falls back when there is no clipboard API at all (edge case)', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    document.execCommand = vi.fn().mockReturnValue(true)
    expect(await copyToClipboard('X')).toBe(true)
  })

  it('returns false when nothing works (edge case)', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    document.execCommand = vi.fn().mockReturnValue(false)
    expect(await copyToClipboard('X')).toBe(false)
    document.execCommand = vi.fn(() => {
      throw new Error('nope')
    })
    expect(await copyToClipboard('X')).toBe(false)
  })
})
