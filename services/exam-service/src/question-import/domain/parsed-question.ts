import type { QuestionType } from '../../question/domain/value-objects/question-content.js'

export interface ParsedQuestion {
  row: number
  type: QuestionType
  bodyHtml: string
  content: Record<string, unknown>
  points: number
}

export interface ImportRowIssue {
  row: number
  reason: string
}

export interface ParseResult {
  questions: ParsedQuestion[]
  errors: ImportRowIssue[]
}

export const JENIS_TYPES = {
  pg: 'MULTIPLE_CHOICE',
  'pg kompleks': 'MULTIPLE_RESPONSE',
  'benar/salah': 'TRUE_FALSE',
  isian: 'SHORT_ANSWER',
  uraian: 'ESSAY',
} as const satisfies Record<string, QuestionType>
