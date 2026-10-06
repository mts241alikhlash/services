import { isWaveFull, pickTargetWave } from './wave-capacity.policy.js'

const source = {
  id: 'w1',
  academicYearId: 'y1',
  startDate: new Date('2027-01-01'),
}

function wave(
  overrides: Partial<Parameters<typeof pickTargetWave>[1][number]>,
) {
  return {
    id: 'w2',
    academicYearId: 'y1',
    startDate: new Date('2027-02-01'),
    quota: 10,
    filledCount: 0,
    ...overrides,
  }
}

describe('wave capacity policy', () => {
  it('is full once filled reaches the quota', () => {
    expect(isWaveFull({ quota: 2, filledCount: 1 })).toBe(false)
    expect(isWaveFull({ quota: 2, filledCount: 2 })).toBe(true)
    expect(isWaveFull({ quota: 2, filledCount: 3 })).toBe(true)
  })

  it('picks the earliest later wave of the same year that is not full', () => {
    const target = pickTargetWave(source, [
      wave({ id: 'later', startDate: new Date('2027-03-01') }),
      wave({ id: 'next', startDate: new Date('2027-02-01') }),
    ])
    expect(target?.id).toBe('next')
  })

  it('skips full waves, other years, earlier waves and the source', () => {
    const target = pickTargetWave(source, [
      wave({ id: 'w1' }),
      wave({ id: 'full', quota: 1, filledCount: 1 }),
      wave({ id: 'other-year', academicYearId: 'y2' }),
      wave({ id: 'earlier', startDate: new Date('2026-12-01') }),
    ])
    expect(target).toBeNull()
  })
})
