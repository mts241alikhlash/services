import {
  ACCESS_CODE_ALPHABET,
  ACCESS_CODE_LENGTH,
  deriveAccessCode,
} from './derive-access-code.policy.js'

const SECRET = 'unit-test-secret-of-at-least-32-characters'
const SCHEDULE = '55555555-5555-4555-8555-555555555555'

describe('deriveAccessCode', () => {
  it('is deterministic for the same inputs', () => {
    expect(deriveAccessCode(SECRET, SCHEDULE, 0)).toBe(
      deriveAccessCode(SECRET, SCHEDULE, 0),
    )
  })

  it('differs by schedule', () => {
    const codes = new Set(
      Array.from({ length: 40 }, (_, i) =>
        deriveAccessCode(
          SECRET,
          `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
          0,
        ),
      ),
    )
    expect(codes.size).toBeGreaterThan(35)
  })

  it('differs by rotation', () => {
    expect(deriveAccessCode(SECRET, SCHEDULE, 0)).not.toBe(
      deriveAccessCode(SECRET, SCHEDULE, 1),
    )
  })

  it('differs by secret', () => {
    expect(deriveAccessCode(SECRET, SCHEDULE, 0)).not.toBe(
      deriveAccessCode(`${SECRET}-other`, SCHEDULE, 0),
    )
  })

  it('has six characters', () => {
    expect(ACCESS_CODE_LENGTH).toBe(6)
    expect(deriveAccessCode(SECRET, SCHEDULE, 3)).toHaveLength(6)
  })

  it('uses only the allowed alphabet without look-alike characters', () => {
    expect(ACCESS_CODE_ALPHABET).toBe('ABCDEFGHJKMNPQRSTUVWXYZ23456789')
    for (let rotation = 0; rotation < 200; rotation++) {
      const code = deriveAccessCode(SECRET, SCHEDULE, rotation)
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/)
    }
  })

  it('picks every alphabet character with the same probability', () => {
    const counts = new Map<string, number>()
    for (let rotation = 0; rotation < 60_000; rotation++) {
      for (const char of deriveAccessCode(SECRET, SCHEDULE, rotation)) {
        counts.set(char, (counts.get(char) ?? 0) + 1)
      }
    }
    const values = [...counts.values()]

    expect(counts.size).toBe(ACCESS_CODE_ALPHABET.length)
    expect(Math.max(...values) / Math.min(...values)).toBeLessThan(1.05)
  })
})
