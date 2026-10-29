import type { ExamAnswerRecord } from '../entities/exam-session.entity.js'
import type { PaperSource } from './build-paper.policy.js'
import { scoreAnswer } from './score-answer.policy.js'

export interface SessionResult {
  scores: { answerId: string; score: number | null }[]
  rawScore: number
  maxScore: number
  pendingManual: number
}

const isBlank = (answer: ExamAnswerRecord): boolean =>
  'text' in answer.answer && answer.answer.text.trim() === ''

export function computeSessionResult(
  sources: readonly PaperSource[],
  answers: readonly ExamAnswerRecord[],
): SessionResult {
  const answerOf = new Map(answers.map((row) => [row.questionId, row]))
  const scores: SessionResult['scores'] = []
  let rawScore = 0
  let maxScore = 0
  let pendingManual = 0

  for (const source of sources) {
    maxScore += source.points
    const answer = answerOf.get(source.questionId) ?? null
    const auto = scoreAnswer(
      source.type,
      source.content,
      answer?.answer ?? null,
      source.points,
    ).score

    let score = auto
    if (auto === null) {
      if (answer === null || isBlank(answer)) score = 0
      else score = answer.score
    }

    if (score === null) pendingManual += 1
    else rawScore += score
    if (answer !== null) scores.push({ answerId: answer.id, score })
  }

  return {
    scores,
    rawScore: Math.round(rawScore * 10000) / 10000,
    maxScore,
    pendingManual,
  }
}
