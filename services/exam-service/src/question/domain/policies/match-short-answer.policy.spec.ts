import { matchShortAnswer } from './match-short-answer.policy.js'

const answer = (
  accepted: string[],
  ignoreCase: boolean,
  ignoreHarakat: boolean,
) => ({ accepted, ignoreCase, ignoreHarakat })

describe('matchShortAnswer', () => {
  it('trims and collapses spaces', () => {
    expect(
      matchShortAnswer(
        '  Jakarta   Pusat ',
        answer(['Jakarta Pusat'], false, false),
      ),
    ).toBe(true)
  })

  it('ignores case only when asked to', () => {
    expect(matchShortAnswer('jakarta', answer(['Jakarta'], true, false))).toBe(
      true,
    )
    expect(matchShortAnswer('jakarta', answer(['Jakarta'], false, false))).toBe(
      false,
    )
  })

  it('accepts any of several accepted answers', () => {
    expect(
      matchShortAnswer(
        'DKI Jakarta',
        answer(['Jakarta', 'DKI Jakarta'], true, false),
      ),
    ).toBe(true)
  })

  it('ignores harakat only when asked to', () => {
    expect(matchShortAnswer('كتاب', answer(['كِتَابٌ'], false, true))).toBe(
      true,
    )
    expect(matchShortAnswer('كِتَابٌ', answer(['كتاب'], false, true))).toBe(
      true,
    )
    expect(matchShortAnswer('كتاب', answer(['كِتَابٌ'], false, false))).toBe(
      false,
    )
  })

  it('treats an empty answer as wrong', () => {
    expect(matchShortAnswer('   ', answer(['Jakarta'], true, false))).toBe(
      false,
    )
  })
})
