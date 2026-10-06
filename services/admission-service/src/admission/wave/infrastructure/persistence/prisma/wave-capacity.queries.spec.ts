import {
  countFilledByWave,
  FILLED_APPLICATION_WHERE,
  withFilledCount,
} from './wave-capacity.queries.js'

describe('wave capacity queries', () => {
  it('counts only verified, non-rejected, live applications per wave', async () => {
    const groupBy = jest
      .fn()
      .mockResolvedValue([{ waveId: 'w1', _count: { _all: 3 } }])
    const counts = await countFilledByWave(
      { admissionApplication: { groupBy } } as never,
      ['w1', 'w2'],
    )

    expect(groupBy).toHaveBeenCalledWith({
      by: ['waveId'],
      where: { ...FILLED_APPLICATION_WHERE, waveId: { in: ['w1', 'w2'] } },
      _count: { _all: true },
    })
    expect(FILLED_APPLICATION_WHERE).toEqual({
      deletedAt: null,
      status: { not: 'REJECTED' },
      payment: { is: { status: 'VERIFIED' } },
    })
    expect(counts.get('w1')).toBe(3)
    expect(counts.get('w2')).toBeUndefined()
  })

  it('does not query without waves and defaults missing counts to zero', async () => {
    const groupBy = jest
      .fn()
      .mockResolvedValue([{ waveId: 'w1', _count: { _all: 2 } }])
    const db = { admissionApplication: { groupBy } } as never

    expect(await countFilledByWave(db, [])).toEqual(new Map())
    expect(groupBy).not.toHaveBeenCalled()
    expect(await withFilledCount(db, [{ id: 'w1' }, { id: 'w2' }])).toEqual([
      { id: 'w1', filledCount: 2 },
      { id: 'w2', filledCount: 0 },
    ])
  })
})
