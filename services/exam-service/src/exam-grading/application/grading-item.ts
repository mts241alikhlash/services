import type { ExamAnswerRecord } from '../../exam-session/domain/entities/exam-session.entity.js'
import type { PaperSource } from '../../exam-session/domain/policies/build-paper.policy.js'

export interface GradingItem {
  questionId: string
  number: number
  type: 'SHORT_ANSWER' | 'ESSAY'
  bodyHtml: string
  points: number
  guideHtml: string | null
  acceptedAnswers: string[] | null
  answer: ExamAnswerRecord['answer'] | null
  score: number | null
  note: string | null
  gradedAt: Date | null
  needsGrading: boolean
}

export const isManual = (type: string): type is 'SHORT_ANSWER' | 'ESSAY' =>
  type === 'SHORT_ANSWER' || type === 'ESSAY'

export const isBlankAnswer = (answer: ExamAnswerRecord | null): boolean =>
  answer === null ||
  ('text' in answer.answer && answer.answer.text.trim() === '')

export function toGradingItem(
  source: PaperSource & { type: 'SHORT_ANSWER' | 'ESSAY' },
  number: number,
  answer: ExamAnswerRecord | null,
): GradingItem {
  const content = source.content as {
    guideHtml?: string | null
    answer?: { accepted: string[] }
  }
  return {
    questionId: source.questionId,
    number,
    type: source.type,
    bodyHtml: source.bodyHtml,
    points: source.points,
    guideHtml: source.type === 'ESSAY' ? (content.guideHtml ?? null) : null,
    acceptedAnswers:
      source.type === 'SHORT_ANSWER' ? (content.answer?.accepted ?? []) : null,
    answer: answer?.answer ?? null,
    score: answer?.score ?? null,
    note: answer?.gradeNote ?? null,
    gradedAt: answer?.gradedAt ?? null,
    needsGrading: !isBlankAnswer(answer) && answer?.score === null,
  }
}
