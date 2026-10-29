import { deriveAccessCode } from './derive-access-code.policy.js'
import { verifyAccessCode } from './verify-access-code.policy.js'

const SECRET = 'unit-test-secret-of-at-least-32-characters'
const SCHEDULE = '55555555-5555-4555-8555-555555555555'
const code = deriveAccessCode(SECRET, SCHEDULE, 2)

describe('verifyAccessCode', () => {
  it('accepts the current code', () => {
    expect(verifyAccessCode(SECRET, SCHEDULE, 2, code)).toBe(true)
  })

  it('ignores case and surrounding spaces', () => {
    expect(
      verifyAccessCode(SECRET, SCHEDULE, 2, `  ${code.toLowerCase()} `),
    ).toBe(true)
  })

  it('rejects a wrong code, an empty one and one of another length', () => {
    expect(verifyAccessCode(SECRET, SCHEDULE, 2, 'AAAAAA')).toBe(false)
    expect(verifyAccessCode(SECRET, SCHEDULE, 2, '')).toBe(false)
    expect(verifyAccessCode(SECRET, SCHEDULE, 2, `${code}A`)).toBe(false)
    expect(verifyAccessCode(SECRET, SCHEDULE, 2, code.slice(0, 5))).toBe(false)
  })

  it('rejects the code of an earlier rotation', () => {
    expect(verifyAccessCode(SECRET, SCHEDULE, 3, code)).toBe(false)
  })

  it('rejects the code of another schedule', () => {
    expect(
      verifyAccessCode(SECRET, '66666666-6666-4666-8666-666666666666', 2, code),
    ).toBe(false)
  })
})
