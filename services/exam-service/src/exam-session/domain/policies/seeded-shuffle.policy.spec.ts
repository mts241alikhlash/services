import { seededShuffle } from './seeded-shuffle.policy.js'

const items = Array.from({ length: 20 }, (_, index) => index)

describe('seededShuffle', () => {
  it('gives the same order for the same seed', () => {
    expect(seededShuffle(items, 'seed-a')).toEqual(
      seededShuffle(items, 'seed-a'),
    )
  })

  it('gives another order for another seed', () => {
    expect(seededShuffle(items, 'seed-a')).not.toEqual(
      seededShuffle(items, 'seed-b'),
    )
  })

  it('keeps every item exactly once and leaves the input alone', () => {
    const input = [...items]
    const shuffled = seededShuffle(input, 'seed-a')

    expect([...shuffled].sort((a, b) => a - b)).toEqual(items)
    expect(input).toEqual(items)
  })

  it('moves items around', () => {
    expect(seededShuffle(items, 'seed-a')).not.toEqual(items)
  })

  it('handles an empty list and a single item', () => {
    expect(seededShuffle([], 'x')).toEqual([])
    expect(seededShuffle(['a'], 'x')).toEqual(['a'])
  })
})
