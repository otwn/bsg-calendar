import { describe, it, expect } from 'vitest'
import { getDayCellClasses, getShiftTimeReminder } from '../scheduleRules'

// Reference month: May 2026
//   May 1 Fri, 3 Sun(1st), 10 Sun(2nd), 17 Sun(3rd), 23 Sat, 24 Sun(4th)
// BSG: Sunday is the only shift day; every other weekday is a no-shift day.
describe('getDayCellClasses', () => {
  it('greys out the 3rd Sunday (District Meeting)', () => {
    expect(getDayCellClasses(new Date(2026, 4, 17))).toContain('no-shift-day')
  })

  it('marks Jan 1 as first-sunday-krg only', () => {
    expect(getDayCellClasses(new Date(2026, 0, 1))).toEqual(['first-sunday-krg'])
  })

  it('greys out Dec 24 through Dec 31', () => {
    expect(getDayCellClasses(new Date(2026, 11, 24))).toEqual(['no-shift-day'])
    expect(getDayCellClasses(new Date(2026, 11, 31))).toEqual(['no-shift-day'])
  })

  it('treats every non-Sunday weekday (incl. Wed/Sat) as a no-shift day', () => {
    expect(getDayCellClasses(new Date(2026, 4, 4))).toContain('no-shift-day') // Mon
    expect(getDayCellClasses(new Date(2026, 4, 5))).toContain('no-shift-day') // Tue
    expect(getDayCellClasses(new Date(2026, 4, 6))).toContain('no-shift-day') // Wed
    expect(getDayCellClasses(new Date(2026, 4, 7))).toContain('no-shift-day') // Thu
    expect(getDayCellClasses(new Date(2026, 4, 8))).toContain('no-shift-day') // Fri
    expect(getDayCellClasses(new Date(2026, 4, 9))).toContain('no-shift-day') // Sat
  })

  it('marks the 1st Sunday (non-January) as first-sunday-krg', () => {
    expect(getDayCellClasses(new Date(2026, 4, 3))).toContain('first-sunday-krg')
  })

  it('leaves a normal Sunday uncoloured (plain shift day)', () => {
    expect(getDayCellClasses(new Date(2026, 4, 10))).toEqual([]) // 2nd Sun
  })
})

// Reference month: May 2026 (see above)
describe('getShiftTimeReminder', () => {
  it('returns the Sunday time', () => {
    // May 10 = 2nd Sunday (regular shift day)
    expect(getShiftTimeReminder(new Date(2026, 4, 10))).toBe('Sunday 8:30am - 12:30pm')
  })

  it('appends the KRG prep note on the first Sunday', () => {
    // May 3 = 1st Sunday (KRG)
    expect(getShiftTimeReminder(new Date(2026, 4, 3)))
      .toBe('Sunday 8:30am - 12:30pm. Note that you may need to be there earlier for KRG prep')
  })

  it('returns just the day name for an occasional Saturday (no fixed time)', () => {
    // May 9 = Saturday; BSG has no fixed Saturday hours
    expect(getShiftTimeReminder(new Date(2026, 4, 9))).toBe('Saturday')
  })
})
