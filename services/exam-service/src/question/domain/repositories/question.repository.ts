import type { QuestionDetail } from '../entities/question.entity.js'
import type {
  QuestionContent,
  QuestionType,
} from '../value-objects/question-content.js'

export interface VersionFields {
  bodyHtml: string
  content: QuestionContent
  points: number
}

export interface NewQuestionInput extends VersionFields {
  packageId: string
  copiedFromQuestionId?: string
  copiedFromVersion?: number
  subjectId: string
  gradeId: string
  authorEmployeeId: string
  type: QuestionType
  createdById: string
}

export interface QuestionPin {
  questionId: string
  number: number
}

export interface PinnedQuestion {
  questionId: string
  copiedFromQuestionId: string | null
  currentVersion: number
  number: number
  type: QuestionType
  bodyHtml: string
  content: QuestionContent
  points: number
}

export abstract class IQuestionRepository {
  abstract findPinned(pins: QuestionPin[]): Promise<PinnedQuestion[]>
  abstract findById(id: string): Promise<QuestionDetail | null>
}
