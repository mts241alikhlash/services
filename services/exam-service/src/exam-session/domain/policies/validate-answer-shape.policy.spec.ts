import { BadRequestException } from '@nestjs/common'
import type { QuestionContent } from '../../../question/domain/value-objects/question-content.js'
import { assertAnswerShape } from './validate-answer-shape.policy.js'

const choices = (['A', 'B', 'C'] as const).map((key) => ({ key, html: key }))
const mc: QuestionContent = { choices, answer: { key: 'A' } }
const mr: QuestionContent = { choices, answer: { keys: ['A', 'B'] } }
const tf: QuestionContent = { answer: { value: true } }
const short: QuestionContent = {
  answer: { accepted: ['x'], ignoreCase: true, ignoreHarakat: false },
}
const essay: QuestionContent = { guideHtml: null }

const bad = 'Bentuk jawaban tidak sesuai dengan jenis soal'

describe('assertAnswerShape', () => {
  it('accepts the shape of each type', () => {
    expect(assertAnswerShape('MULTIPLE_CHOICE', mc, { key: 'B' })).toEqual({
      key: 'B',
    })
    expect(
      assertAnswerShape('MULTIPLE_RESPONSE', mr, { keys: ['A', 'C'] }),
    ).toEqual({
      keys: ['A', 'C'],
    })
    expect(assertAnswerShape('TRUE_FALSE', tf, { value: false })).toEqual({
      value: false,
    })
    expect(assertAnswerShape('SHORT_ANSWER', short, { text: 'jawab' })).toEqual(
      {
        text: 'jawab',
      },
    )
    expect(assertAnswerShape('ESSAY', essay, { text: 'uraian' })).toEqual({
      text: 'uraian',
    })
  })

  it('accepts an empty selection and an empty text so a student can clear an answer', () => {
    expect(assertAnswerShape('MULTIPLE_RESPONSE', mr, { keys: [] })).toEqual({
      keys: [],
    })
    expect(assertAnswerShape('ESSAY', essay, { text: '' })).toEqual({
      text: '',
    })
  })

  it('rejects a shape of another type', () => {
    expect(() =>
      assertAnswerShape('MULTIPLE_CHOICE', mc, { keys: ['A'] }),
    ).toThrow(bad)
    expect(() => assertAnswerShape('TRUE_FALSE', tf, { key: 'A' })).toThrow(bad)
    expect(() => assertAnswerShape('ESSAY', essay, { value: true })).toThrow(
      bad,
    )
  })

  it('rejects something that is not an object', () => {
    for (const value of [null, undefined, 'A', 3, ['A']]) {
      expect(() => assertAnswerShape('MULTIPLE_CHOICE', mc, value)).toThrow(
        BadRequestException,
      )
    }
  })

  it('rejects a key that is not a choice of the question', () => {
    expect(() =>
      assertAnswerShape('MULTIPLE_CHOICE', mc, { key: 'E' }),
    ).toThrow(bad)
    expect(() =>
      assertAnswerShape('MULTIPLE_RESPONSE', mr, { keys: ['A', 'D'] }),
    ).toThrow(bad)
  })

  it('rejects duplicated keys and extra properties', () => {
    expect(() =>
      assertAnswerShape('MULTIPLE_RESPONSE', mr, { keys: ['A', 'A'] }),
    ).toThrow(bad)
    expect(() =>
      assertAnswerShape('MULTIPLE_CHOICE', mc, { key: 'A', x: 1 }),
    ).toThrow(bad)
  })

  it('rejects a value that is not a boolean and a text that is not a string', () => {
    expect(() =>
      assertAnswerShape('TRUE_FALSE', tf, { value: 'true' }),
    ).toThrow(bad)
    expect(() => assertAnswerShape('ESSAY', essay, { text: 5 })).toThrow(bad)
  })

  it('rejects a text longer than 20000 characters', () => {
    expect(() =>
      assertAnswerShape('ESSAY', essay, { text: 'x'.repeat(20001) }),
    ).toThrow(bad)
    expect(
      assertAnswerShape('ESSAY', essay, { text: 'x'.repeat(20000) }),
    ).toBeDefined()
  })
})
