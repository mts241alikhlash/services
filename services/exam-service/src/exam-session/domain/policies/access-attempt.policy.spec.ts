import {
  type AttemptState,
  LOCK_MINUTES,
  MAX_FAILURES,
  isLocked,
  nextAttemptState,
} from './access-attempt.policy.js'

const now = new Date('2026-11-02T01:00:00.000Z')
const clean: AttemptState = { failures: 0, lockedUntil: null }

describe('access attempts', () => {
  it('counts a wrong code', () => {
    expect(nextAttemptState(clean, now, false)).toEqual({
      failures: 1,
      lockedUntil: null,
    })
  })

  it('locks on the fifth wrong code and starts counting again afterwards', () => {
    let state = clean
    for (let attempt = 0; attempt < MAX_FAILURES; attempt++) {
      state = nextAttemptState(state, now, false)
    }

    expect(MAX_FAILURES).toBe(5)
    expect(LOCK_MINUTES).toBe(5)
    expect(state.failures).toBe(0)
    expect(state.lockedUntil).toEqual(new Date('2026-11-02T01:05:00.000Z'))
    expect(isLocked(state, now)).toBe(true)
  })

  it('unlocks when the lock time has passed', () => {
    const state = {
      failures: 0,
      lockedUntil: new Date('2026-11-02T01:05:00.000Z'),
    }

    expect(isLocked(state, new Date('2026-11-02T01:04:59.000Z'))).toBe(true)
    expect(isLocked(state, new Date('2026-11-02T01:05:00.000Z'))).toBe(false)
  })

  it('clears the failures after a correct code', () => {
    expect(
      nextAttemptState({ failures: 4, lockedUntil: null }, now, true),
    ).toEqual(clean)
  })

  it('is not locked without a lock time', () => {
    expect(isLocked(clean, now)).toBe(false)
  })
})
