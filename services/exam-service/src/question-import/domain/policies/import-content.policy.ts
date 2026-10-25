import type {
  Choice,
  ChoiceKey,
  QuestionType,
} from '../../../question/domain/value-objects/question-content.js'
import { textToHtml } from './inline-latex.policy.js'

export class ImportRowError extends Error {}

export function parsePoints(text: string): number {
  if (text === '') return 1
  const points = Number(text.replace(',', '.'))
  if (!Number.isFinite(points)) {
    throw new ImportRowError('Poin harus berupa angka')
  }
  return points
}

export interface ImportAnswerSource {
  choices: Choice[]
  key: string
  ignoreHarakat?: boolean
}

const TRUE_WORDS = ['benar', 'true', 'ya']
const FALSE_WORDS = ['salah', 'false', 'tidak']

export function buildImportContent(
  type: QuestionType,
  source: ImportAnswerSource,
): Record<string, unknown> {
  const key = source.key.trim()

  switch (type) {
    case 'MULTIPLE_CHOICE':
      return { choices: source.choices, answer: { key: key.toUpperCase() } }
    case 'MULTIPLE_RESPONSE': {
      const keys = key
        .split(/[\s,;]+/u)
        .filter((part) => part !== '')
        .map((part) => part.toUpperCase() as ChoiceKey)
      return {
        choices: source.choices,
        answer: { keys: [...new Set(keys)] },
      }
    }
    case 'TRUE_FALSE': {
      const word = key.toLowerCase()
      if (TRUE_WORDS.includes(word)) return { answer: { value: true } }
      if (FALSE_WORDS.includes(word)) return { answer: { value: false } }
      throw new ImportRowError('Kunci harus Benar atau Salah')
    }
    case 'SHORT_ANSWER':
      return {
        answer: {
          accepted: key
            .split('|')
            .map((part) => part.trim())
            .filter((part) => part !== ''),
          ignoreCase: true,
          ignoreHarakat: source.ignoreHarakat === true,
        },
      }
    case 'ESSAY':
      return { guideHtml: key === '' ? null : textToHtml(key) }
  }
}
