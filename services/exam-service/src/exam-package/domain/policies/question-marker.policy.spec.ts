import { questionMarker } from './question-marker.policy.js'

describe('questionMarker', () => {
  it('a question without lineage is NEW', () => {
    expect(
      questionMarker({ copiedFromQuestionId: null, currentVersion: 1 }),
    ).toBe('NEW')
    expect(
      questionMarker({ copiedFromQuestionId: null, currentVersion: 3 }),
    ).toBe('NEW')
  })

  it('a copy still at its first version is COPIED', () => {
    expect(
      questionMarker({ copiedFromQuestionId: 'q1', currentVersion: 1 }),
    ).toBe('COPIED')
  })

  it('a copy with a newer version is CHANGED', () => {
    expect(
      questionMarker({ copiedFromQuestionId: 'q1', currentVersion: 2 }),
    ).toBe('CHANGED')
  })
})
