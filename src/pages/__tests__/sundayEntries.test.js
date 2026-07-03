import { describe, it, expect } from 'vitest'
import { getSundayEntries } from '../scheduleRules'

// July 2026 calendar:
//   Sun  Mon  Tue  Wed  Thu  Fri  Sat
//              1    2    3
//    5    6    7    8    9   10   11
//   12   13   14   15   16   17   18
//   19   20   21   22   23   24   25
//   26   27   28   29   30   31
// Wait — let me verify. July 1, 2026 is a Wednesday.
// Sundays: 5, 12, 19, 26
describe('getSundayEntries — July 2026 (month=6)', () => {
  const entries = getSundayEntries(2026, 6)

  it('returns the correct number of Sundays', () => {
    expect(entries).toHaveLength(4)
  })

  it('entries are sorted ascending by date', () => {
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].date.getTime()).toBeGreaterThan(entries[i - 1].date.getTime())
    }
  })

  it('first Sunday (Jul 5) is flagged isKRG', () => {
    expect(entries[0].dateStr).toBe('2026-07-05')
    expect(entries[0].isKRG).toBe(true)
    expect(entries[0].needed).toBe(4)
  })

  it('third Sunday (Jul 19) is flagged isNoShift (district meeting)', () => {
    expect(entries[2].dateStr).toBe('2026-07-19')
    expect(entries[2].isNoShift).toBe(true)
    expect(entries[2].needed).toBe(0)
  })

  it('second Sunday (Jul 12) is a normal shift day', () => {
    expect(entries[1].dateStr).toBe('2026-07-12')
    expect(entries[1].isKRG).toBe(false)
    expect(entries[1].isNoShift).toBe(false)
    expect(entries[1].needed).toBe(1)
  })

  it('dateStr format is YYYY-MM-DD with no timezone shift', () => {
    entries.forEach(e => {
      expect(e.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      // The dateStr must reflect the local date, not a UTC-shifted date
      const parts = e.dateStr.split('-')
      expect(Number(parts[0])).toBe(e.date.getFullYear())
      expect(Number(parts[1])).toBe(e.date.getMonth() + 1)
      expect(Number(parts[2])).toBe(e.date.getDate())
    })
  })
})

// January 2026 calendar:
//   Jan 1 = Thursday. Sundays: 4, 11, 18, 25
describe('getSundayEntries — January 2026 (month=0)', () => {
  const entries = getSundayEntries(2026, 0)

  it('includes Jan 1st even though it is not a Sunday', () => {
    const jan1 = entries.find(e => e.dateStr === '2026-01-01')
    expect(jan1).toBeDefined()
  })

  it('Jan 1st is flagged isKRG', () => {
    const jan1 = entries.find(e => e.dateStr === '2026-01-01')
    expect(jan1.isKRG).toBe(true)
    expect(jan1.needed).toBe(4)
  })

  it('Jan 1st comes first in sorted order (before first Sunday Jan 4)', () => {
    expect(entries[0].dateStr).toBe('2026-01-01')
    expect(entries[1].dateStr).toBe('2026-01-04')
  })

  it('first Sunday of January (Jan 4) is NOT flagged isKRG (January excluded from generic rule)', () => {
    const jan4 = entries.find(e => e.dateStr === '2026-01-04')
    expect(jan4.isKRG).toBe(false)
    expect(jan4.needed).toBe(1)
  })

  it('total entries = 4 Sundays + 1 Jan 1st = 5', () => {
    expect(entries).toHaveLength(5)
  })
})

describe('getSundayEntries — needed values', () => {
  it('no-shift Sunday has needed===0', () => {
    // July 2026: 3rd Sunday (Jul 19) is no-shift
    const entries = getSundayEntries(2026, 6)
    const noShift = entries.find(e => e.isNoShift)
    expect(noShift).toBeDefined()
    expect(noShift.needed).toBe(0)
  })

  it('KRG Sunday has needed===4', () => {
    const entries = getSundayEntries(2026, 6)
    const krg = entries.find(e => e.isKRG)
    expect(krg).toBeDefined()
    expect(krg.needed).toBe(4)
  })

  it('normal Sunday has needed===1', () => {
    const entries = getSundayEntries(2026, 6)
    const normal = entries.find(e => !e.isKRG && !e.isNoShift)
    expect(normal).toBeDefined()
    expect(normal.needed).toBe(1)
  })
})
