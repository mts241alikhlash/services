import { GRACE_MINUTES, computeTimes } from './session-times.policy.js'

const at = (value: string) => new Date(`2026-11-02T${value}:00.000Z`)

describe('computeTimes', () => {
  it('ends the working time after the duration and the sending time ten minutes later', () => {
    const { deadline, finalizeAt } = computeTimes({
      startedAt: at('01:15'),
      durationMinutes: 90,
      scheduleEndsAt: at('04:00'),
    })

    expect(deadline).toEqual(at('02:45'))
    expect(finalizeAt).toEqual(at('02:55'))
    expect(GRACE_MINUTES).toBe(10)
  })

  it('cuts the working time at the end of the window for a late start', () => {
    const { deadline, finalizeAt } = computeTimes({
      startedAt: at('03:30'),
      durationMinutes: 90,
      scheduleEndsAt: at('04:00'),
    })

    expect(deadline).toEqual(at('04:00'))
    expect(finalizeAt).toEqual(at('04:10'))
  })

  it('keeps the full duration when it ends exactly at the window end', () => {
    expect(
      computeTimes({
        startedAt: at('02:30'),
        durationMinutes: 90,
        scheduleEndsAt: at('04:00'),
      }).deadline,
    ).toEqual(at('04:00'))
  })
})
