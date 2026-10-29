import { AccessCodeService } from './access-code.service.js'

const SCHEDULE = '55555555-5555-4555-8555-555555555555'
const codes = new AccessCodeService(
  'unit-test-secret-of-at-least-32-characters',
)

describe('AccessCodeService.matches', () => {
  it('accepts the current code in any case', () => {
    const code = codes.codeFor(SCHEDULE, 1)

    expect(codes.matches(SCHEDULE, 1, code)).toBe(true)
    expect(codes.matches(SCHEDULE, 1, code.toLowerCase())).toBe(true)
  })

  it('rejects a code of an earlier rotation and a made up one', () => {
    expect(codes.matches(SCHEDULE, 2, codes.codeFor(SCHEDULE, 1))).toBe(false)
    expect(codes.matches(SCHEDULE, 1, 'AAAAAA')).toBe(false)
  })
})
