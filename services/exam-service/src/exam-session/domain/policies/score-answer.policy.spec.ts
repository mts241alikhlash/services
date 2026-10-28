import type { QuestionContent } from '../../../question/domain/value-objects/question-content.js'
import { scoreAnswer } from './score-answer.policy.js'

const choices = (['A', 'B', 'C', 'D'] as const).map((key) => ({
  key,
  html: key,
}))
const mc: QuestionContent = { choices, answer: { key: 'B' } }
const mr: QuestionContent = { choices, answer: { keys: ['A', 'B'] } }
const tf: QuestionContent = { answer: { value: true } }

describe('scoreAnswer', () => {
  it('gives all or nothing for a single choice', () => {
    expect(scoreAnswer('MULTIPLE_CHOICE', mc, { key: 'B' }, 3)).toEqual({
      score: 3,
    })
    expect(scoreAnswer('MULTIPLE_CHOICE', mc, { key: 'A' }, 3)).toEqual({
      score: 0,
    })
  })

  it('gives all or nothing for true or false', () => {
    expect(scoreAnswer('TRUE_FALSE', tf, { value: true }, 2)).toEqual({
      score: 2,
    })
    expect(scoreAnswer('TRUE_FALSE', tf, { value: false }, 2)).toEqual({
      score: 0,
    })
  })

  it('scores a multiple response in proportion, minus the wrong picks', () => {
    expect(
      scoreAnswer('MULTIPLE_RESPONSE', mr, { keys: ['A', 'B'] }, 4),
    ).toEqual({ score: 4 })
    expect(scoreAnswer('MULTIPLE_RESPONSE', mr, { keys: ['A'] }, 4)).toEqual({
      score: 2,
    })
    expect(
      scoreAnswer('MULTIPLE_RESPONSE', mr, { keys: ['A', 'C'] }, 4),
    ).toEqual({ score: 0 })
    expect(
      scoreAnswer('MULTIPLE_RESPONSE', mr, { keys: ['A', 'B', 'C'] }, 4),
    ).toEqual({
      score: 2,
    })
  })

  it('never goes below zero', () => {
    expect(
      scoreAnswer('MULTIPLE_RESPONSE', mr, { keys: ['C', 'D'] }, 4),
    ).toEqual({ score: 0 })
    expect(
      scoreAnswer('MULTIPLE_RESPONSE', mr, { keys: ['A', 'C', 'D'] }, 4),
    ).toEqual({
      score: 0,
    })
  })

  it('rounds away floating point noise', () => {
    const three: QuestionContent = {
      choices,
      answer: { keys: ['A', 'B', 'C'] },
    }

    expect(scoreAnswer('MULTIPLE_RESPONSE', three, { keys: ['A'] }, 1)).toEqual(
      {
        score: 0.3333,
      },
    )
  })

  it('scores an objective question without an answer as zero', () => {
    expect(scoreAnswer('MULTIPLE_CHOICE', mc, null, 3)).toEqual({ score: 0 })
    expect(scoreAnswer('MULTIPLE_RESPONSE', mr, null, 3)).toEqual({ score: 0 })
    expect(scoreAnswer('TRUE_FALSE', tf, null, 3)).toEqual({ score: 0 })
  })

  it('leaves a short answer and an essay for the teacher', () => {
    const short: QuestionContent = {
      answer: { accepted: ['x'], ignoreCase: true, ignoreHarakat: false },
    }

    expect(scoreAnswer('SHORT_ANSWER', short, { text: 'x' }, 3)).toEqual({
      score: null,
    })
    expect(scoreAnswer('ESSAY', { guideHtml: null }, { text: 'x' }, 3)).toEqual(
      {
        score: null,
      },
    )
    expect(scoreAnswer('ESSAY', { guideHtml: null }, null, 3)).toEqual({
      score: null,
    })
  })
})
