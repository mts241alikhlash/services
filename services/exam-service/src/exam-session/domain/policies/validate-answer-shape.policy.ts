import { BadRequestException } from '@nestjs/common'
import type {
  ChoiceKey,
  QuestionContent,
  QuestionType,
} from '../../../question/domain/value-objects/question-content.js'

export type AnswerPayload =
  | { key: ChoiceKey }
  | { keys: ChoiceKey[] }
  | { value: boolean }
  | { text: string }

export const MAX_ANSWER_TEXT = 20000
const MESSAGE = 'Bentuk jawaban tidak sesuai dengan jenis soal'

function fail(): never {
  throw new BadRequestException(MESSAGE)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function onlyKey(value: Record<string, unknown>, name: string): unknown {
  const names = Object.keys(value)
  if (names.length !== 1 || names[0] !== name) return fail()
  return value[name]
}

function choiceKeys(content: QuestionContent): Set<string> {
  const choices = (content as { choices?: { key: string }[] }).choices ?? []
  return new Set(choices.map((choice) => choice.key))
}

export function assertAnswerShape(
  type: QuestionType,
  content: QuestionContent,
  answer: unknown,
): AnswerPayload {
  if (!isRecord(answer)) return fail()

  switch (type) {
    case 'MULTIPLE_CHOICE': {
      const key = onlyKey(answer, 'key')
      if (typeof key !== 'string' || !choiceKeys(content).has(key))
        return fail()
      return { key: key as ChoiceKey }
    }
    case 'MULTIPLE_RESPONSE': {
      const keys = onlyKey(answer, 'keys')
      const allowed = choiceKeys(content)
      if (
        !Array.isArray(keys) ||
        keys.some((key) => typeof key !== 'string' || !allowed.has(key)) ||
        new Set(keys).size !== keys.length
      ) {
        return fail()
      }
      return { keys: keys as ChoiceKey[] }
    }
    case 'TRUE_FALSE': {
      const value = onlyKey(answer, 'value')
      if (typeof value !== 'boolean') return fail()
      return { value }
    }
    case 'SHORT_ANSWER':
    case 'ESSAY': {
      const text = onlyKey(answer, 'text')
      if (typeof text !== 'string' || text.length > MAX_ANSWER_TEXT)
        return fail()
      return { text }
    }
  }
}
