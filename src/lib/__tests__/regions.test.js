import { describe, expect, it } from 'vitest'
import { isInGreaterAustin } from '../regions'

describe('isInGreaterAustin', () => {
  it('recognizes Austin and nearby cities', () => {
    expect(isInGreaterAustin(30.2672, -97.7431)).toBe(true)
    expect(isInGreaterAustin(30.5052, -97.8203)).toBe(true)
  })

  it('does not classify distant cities as Greater Austin', () => {
    expect(isInGreaterAustin(31.5515, -97.1467)).toBe(false)
  })
})
