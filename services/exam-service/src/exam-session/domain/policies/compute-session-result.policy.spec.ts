import type { ExamAnswerRecord } from '../entities/exam-session.entity.js'
import { computeSessionResult } from './compute-session-result.policy.js'
import type { PaperSource } from './build-paper.policy.js'
import type { ChoiceKey } from '../../../question/domain/value-objects/question-content.js'
import type { AnswerPayload } from './validate-answer-shape.policy.js'

const choices = (['A', 'B', 'C'] as ChoiceKey[]).map((key) => ({
  key,
  html: key,
}))

const mc: PaperSource = {
  questionId: 'mc',
  type: 'MULTIPLE_CHOICE',
  bodyHtml: '',
  content: { choices, answer: { key: 'B' } },
  points: 2,
}
const mr: PaperSource = {
  questionId: 'mr',
  type: 'MULTIPLE_RESPONSE',
  bodyHtml: '',
  content: { choices, answer: { keys: ['A', 'B'] } },
  points: 4,
}
const essay: PaperSource = {
  questionId: 'essay',
  type: 'ESSAY',
  bodyHtml: '',
  content: { guideHtml: null },
  points: 10,
}
const short: PaperSource = {
  questionId: 'short',
  type: 'SHORT_ANSWER',
  bodyHtml: '',
  content: {
    answer: { accepted: ['x'], ignoreCase: true, ignoreHarakat: true },
  },
  points: 3,
}

const answer = (
  questionId: string,
  payload: AnswerPayload,
  score: number | null = null,
): ExamAnswerRecord => ({
  id: `a-${questionId}`,
  sessionId: 's1',
  questionId,
  answer: payload,
  clientId: `c-${questionId}`,
  receivedAfterDeadline: false,
  score,
  gradedById: null,
  gradedAt: null,
  gradeNote: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
})

describe('computeSessionResult', () => {
  it('scores objective questions and totals the points of the paper', () => {
    const result = computeSessionResult(
      [mc, mr],
      [answer('mc', { key: 'B' }), answer('mr', { keys: ['A', 'C'] })],
    )

    expect(result).toMatchObject({ rawScore: 2, maxScore: 6, pendingManual: 0 })
  })

  it('keeps multiple response proportional', () => {
    const result = computeSessionResult([mr], [answer('mr', { keys: ['A'] })])

    expect(result.rawScore).toBe(2)
  })

  it('scores a blank essay and a missing short answer as zero without holding the session', () => {
    const result = computeSessionResult(
      [essay, short],
      [answer('essay', { text: '   ' })],
    )

    expect(result).toMatchObject({
      rawScore: 0,
      maxScore: 13,
      pendingManual: 0,
    })
    expect(result.scores).toEqual([{ answerId: 'a-essay', score: 0 }])
  })

  it('waits for the teacher when an essay has text', () => {
    const result = computeSessionResult(
      [essay],
      [answer('essay', { text: 'jawaban' })],
    )

    expect(result.pendingManual).toBe(1)
    expect(result.scores).toEqual([{ answerId: 'a-essay', score: null }])
  })

  it('counts a graded manual answer toward the raw score', () => {
    const result = computeSessionResult(
      [mc, essay],
      [answer('mc', { key: 'B' }), answer('essay', { text: 'jawaban' }, 7.5)],
    )

    expect(result).toMatchObject({
      rawScore: 9.5,
      maxScore: 12,
      pendingManual: 0,
    })
  })

  it('rounds the raw score to four decimals', () => {
    const third: PaperSource = { ...mr, points: 1 }
    const result = computeSessionResult(
      [third],
      [answer('mr', { keys: ['A'] })],
    )

    expect(result.rawScore).toBe(0.5)
  })
})
