import { isUsable, slidExpiry } from './session-lifetime.policy.js'

const now = new Date('2026-10-02T08:00:00.000Z')
const later = (ms: number) => new Date(now.getTime() + ms)
const live = {
  revokedAt: null,
  expiresAt: later(60_000),
  absoluteExpiresAt: later(120_000),
}

describe('isUsable', () => {
  it('accepts a live session without a parent', () => {
    expect(isUsable(live, now)).toBe(true)
  })

  it('refuses a revoked session', () => {
    expect(isUsable({ ...live, revokedAt: now }, now)).toBe(false)
  })

  it('refuses a session past its idle limit', () => {
    expect(isUsable({ ...live, expiresAt: now }, now)).toBe(false)
  })

  it('refuses a session past its absolute limit', () => {
    expect(isUsable({ ...live, absoluteExpiresAt: now }, now)).toBe(false)
  })

  it('refuses an app session whose central session was revoked', () => {
    expect(
      isUsable({ ...live, parent: { ...live, revokedAt: now } }, now),
    ).toBe(false)
  })

  it('accepts an app session whose central session is live', () => {
    expect(isUsable({ ...live, parent: live }, now)).toBe(true)
  })
})

describe('slidExpiry', () => {
  it('moves the idle limit forward', () => {
    expect(slidExpiry(now, 1_000, later(120_000))).toEqual(later(1_000))
  })

  it('never passes the absolute limit', () => {
    expect(slidExpiry(now, 600_000, later(120_000))).toEqual(later(120_000))
  })
})
