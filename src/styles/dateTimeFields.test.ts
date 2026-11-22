import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.tsx$/.test(name) && !/\.test\./.test(name) ? [path] : []
  })
}

const css = readFileSync(join(__dirname, '..', 'index.css'), 'utf8')

describe('date and time fields look the same everywhere', () => {
  it('every date, time, datetime-local and month input uses the shared dt-field class', () => {
    const offenders: string[] = []
    for (const file of sourceFiles(join(__dirname, '..'))) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(/<input\b[\s\S]*?\/>/g)) {
        const tag = match[0]
        if (/type="(date|time|datetime-local|month)"/.test(tag) && !/dt-field/.test(tag)) {
          offenders.push(file.replace(join(__dirname, '..'), 'src'))
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('there is at least one such field (the check is not empty)', () => {
    let count = 0
    for (const file of sourceFiles(join(__dirname, '..'))) {
      count += (readFileSync(file, 'utf8').match(/type="(date|time)"/g) ?? []).length
    }
    expect(count).toBeGreaterThanOrEqual(10)
  })

  it('the shared class styles the field, its focus and disabled states and the calendar icon', () => {
    for (const piece of [
      '.dt-field {',
      '.dt-field:focus',
      '.dt-field:disabled',
      ".dt-field[aria-invalid='true']",
      '.dt-field::-webkit-calendar-picker-indicator',
      '.dt-field::-webkit-date-and-time-value',
      'color-scheme: light',
    ]) {
      expect(css).toContain(piece)
    }
  })
})
