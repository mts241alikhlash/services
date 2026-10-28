import type {
  ChoiceKey,
  QuestionContent,
  QuestionType,
} from '../../../question/domain/value-objects/question-content.js'
import { seededShuffle } from './seeded-shuffle.policy.js'

export interface PaperSource {
  questionId: string
  type: QuestionType
  bodyHtml: string
  content: QuestionContent
  points: number
}

export interface PaperQuestion {
  questionId: string
  number: number
  type: QuestionType
  bodyHtml: string
  points: number
  choices: { key: ChoiceKey; html: string }[] | null
}

function choicesOf(
  source: PaperSource,
  seed: string,
): { key: ChoiceKey; html: string }[] | null {
  if (
    source.type !== 'MULTIPLE_CHOICE' &&
    source.type !== 'MULTIPLE_RESPONSE'
  ) {
    return null
  }
  const content = source.content as {
    choices: { key: ChoiceKey; html: string }[]
  }
  return seededShuffle(content.choices, `${seed}:${source.questionId}`).map(
    (choice) => ({ key: choice.key, html: choice.html }),
  )
}

export function buildPaper(
  sources: readonly PaperSource[],
  seed: string,
): PaperQuestion[] {
  return seededShuffle(sources, seed).map((source, index) => ({
    questionId: source.questionId,
    number: index + 1,
    type: source.type,
    bodyHtml: source.bodyHtml,
    points: source.points,
    choices: choicesOf(source, seed),
  }))
}
