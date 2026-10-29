import type {
  QuestionContent,
  QuestionType,
} from '../../../question/domain/value-objects/question-content.js'
import type { AnswerPayload } from './validate-answer-shape.policy.js'

const round = (value: number) => Math.round(value * 10000) / 10000

export function scoreAnswer(
  type: QuestionType,
  content: QuestionContent,
  answer: AnswerPayload | null,
  points: number,
): { score: number | null } {
  switch (type) {
    case 'MULTIPLE_CHOICE': {
      const correct = (content as { answer: { key: string } }).answer.key
      return {
        score: answer && 'key' in answer && answer.key === correct ? points : 0,
      }
    }
    case 'TRUE_FALSE': {
      const correct = (content as { answer: { value: boolean } }).answer.value
      return {
        score:
          answer && 'value' in answer && answer.value === correct ? points : 0,
      }
    }
    case 'MULTIPLE_RESPONSE': {
      if (!answer || !('keys' in answer)) return { score: 0 }
      const correct = new Set(
        (content as { answer: { keys: string[] } }).answer.keys,
      )
      const right = answer.keys.filter((key) => correct.has(key)).length
      const wrong = answer.keys.length - right
      return {
        score: round((points * Math.max(0, right - wrong)) / correct.size),
      }
    }
    case 'SHORT_ANSWER':
    case 'ESSAY':
      return { score: null }
  }
}
